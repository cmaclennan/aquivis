import { createAdminClient } from '@/lib/supabase/admin'

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

const lookupsCache: Map<string, { data: any; at: number }> = new Map()
const LOOKUPS_TTL_MS = 30_000

export async function technicianNames(ids: string[], supabase?: Supa) {
  const db = getAdmin(supabase)
  if (!ids?.length) return {}
  const { data } = await db
    .from('profiles' as any)
    .select('id, first_name, last_name')
    .in('id', ids)
  const map: Record<string, string> = {}
  ;(data || []).forEach((t: any) => {
    const name = `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Technician'
    map[t.id] = name
  })
  return map
}

export async function servicesReport(companyId: string, filters: any = {}, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { dateRange, startDate, endDate, serviceType, unitType, property, status } = filters || {}
  let query = db
    .from('services' as any)
    .select(`
      id,
      service_date,
      service_type,
      status,
      units:units!inner(
        name,
        unit_type,
        properties!inner(id, name, company_id)
      )
    `)
    .eq('units.properties.company_id', companyId)

  if (dateRange === 'custom' && startDate && endDate) {
    query = query
      .gte('service_date', `${startDate}T00:00:00.000Z`)
      .lte('service_date', `${endDate}T23:59:59.999Z`)
  } else {
    const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30
    const d = new Date()
    d.setDate(d.getDate() - days)
    query = query.gte('service_date', d.toISOString())
  }

  if (serviceType) query = query.eq('service_type', serviceType)
  if (unitType) query = query.eq('units.unit_type', unitType)
  if (property) query = query.eq('units.properties.id', property)
  if (status) query = query.eq('status', status)

  // Optional pagination
  const limit = Number((filters as any)?.limit)
  const offset = Number((filters as any)?.offset)
  if (Number.isFinite(limit) && limit > 0) {
    if (Number.isFinite(offset) && offset >= 0) {
      query = query.range(offset, offset + limit - 1)
    } else {
      query = query.limit(limit)
    }
  }

  const { data, error } = await query.order('service_date', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function equipmentLogsReport(
  companyId: string,
  startDate: string,
  endDate: string,
  property?: string,
  supabase?: Supa,
  options?: { limit?: number; offset?: number }
) {
  const db = getAdmin(supabase)
  let query = db
    .from('equipment_maintenance_logs' as any)
    .select('maintenance_date, maintenance_time, actions, notes, equipment:equipment_id(name, properties!inner(id, name, company_id))')
    .eq('equipment.properties.company_id', companyId)
    .gte('maintenance_date', startDate)
    .lte('maintenance_date', endDate)
    .order('maintenance_date', { ascending: false })
  if (property) query = query.eq('equipment.properties.id', property)
  if (options?.limit && Number.isFinite(options.limit) && options.limit > 0) {
    if (options?.offset && Number.isFinite(options.offset) && options.offset >= 0) {
      query = query.range(options.offset, options.offset + options.limit - 1)
    } else {
      query = query.limit(options.limit)
    }
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function chemicalsSummary(companyId: string, filters: any = {}, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { dateRange, startDate, endDate } = filters || {}
  let startIso: string
  let endIso: string
  if (dateRange === 'custom' && startDate && endDate) {
    startIso = `${startDate}T00:00:00.000Z`
    endIso = `${endDate}T23:59:59.999Z`
  } else {
    const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    startIso = start.toISOString()
    endIso = end.toISOString()
  }

  const { data, error } = await db.rpc('chemicals_summary_agg' as any, {
    p_company_id: companyId,
    p_start: startIso,
    p_end: endIso,
  })
  if (error) throw new Error(error.message)

  const grouped: Record<string, { quantity: number; unit: string }> = {}
  ;(data || []).forEach((row: any) => {
    const key = row.chemical_type || 'unknown'
    if (!grouped[key]) grouped[key] = { quantity: 0, unit: row.unit_of_measure || '' }
    grouped[key].quantity += Number(row.total || 0)
    grouped[key].unit = row.unit_of_measure || grouped[key].unit
  })
  return grouped
}

export async function lookups(companyId: string, supabase?: Supa) {
  const now = Date.now()
  const cached = lookupsCache.get(companyId)
  if (cached && now - cached.at < LOOKUPS_TTL_MS) return cached.data

  const db = getAdmin(supabase)
  const [{ data: properties }, { data: customers }] = await Promise.all([
    db.from('properties' as any).select('id, name').eq('company_id', companyId).order('name'),
    db.from('customers' as any).select('id, name').eq('company_id', companyId).order('name'),
  ])
  const result = { properties: properties || [], customers: customers || [] }
  lookupsCache.set(companyId, { data: result, at: now })
  return result
}

export async function billingReport(companyId: string, startDate: string, endDate: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const startIso = `${startDate}T00:00:00.000Z`
  const endIso = `${endDate}T23:59:59.999Z`

  const { data: chemRows, error: chemErr } = await db
    .from('chemical_additions' as any)
    .select(
      'quantity, unit_of_measure, chemical_type, services!inner(service_date, units!inner(id, customer_id, properties!inner(id, name, customer_id, company_id)))'
    )
    .eq('services.units.properties.company_id', companyId)
    .gte('services.service_date', startIso)
    .lte('services.service_date', endIso)
  if (chemErr) throw new Error(chemErr.message)

  const { data: prices } = await db
    .from('company_chemical_prices' as any)
    .select('chemical_code, unit, price_per_unit, property_id')
    .eq('company_id', companyId)

  const priceKey = (code: string, unit: string, propertyId?: string) => `${propertyId || 'all'}::${code}::${unit}`
  const priceMap: Record<string, number> = {}
  ;(prices || []).forEach((p: any) => {
    priceMap[priceKey(p.chemical_code, p.unit, p.property_id || undefined)] = Number(p.price_per_unit)
  })

  const [{ data: customers }, { data: properties }] = await Promise.all([
    db.from('customers' as any).select('id, name').eq('company_id', companyId),
    db.from('properties' as any).select('id, name').eq('company_id', companyId),
  ])
  const customerNameById = new Map<string, string>((customers || []).map((c: any) => [c.id, c.name]))
  const propertyNameById = new Map<string, string>((properties || []).map((p: any) => [p.id, p.name]))

  const chemicals: Array<{ customer: string; property: string; chemical: string; unit: string; quantity: number; cost: number }> = []
  const grouped: Record<string, { customer: string; property: string; chemical: string; unit: string; quantity: number; cost: number }> = {}

  ;(chemRows || []).forEach((r: any) => {
    const prop = r.services?.units?.properties
    const custId = r.services?.units?.customer_id || prop?.customer_id || ''
    const customer = customerNameById.get(custId) || 'Unassigned'
    const chem = r.chemical_type || 'unknown'
    const unit = r.unit_of_measure || ''
    const key = `${customer}||${prop?.name || ''}||${chem}||${unit}`
    const qty = Number(r.quantity || 0)
    const unitPrice = priceMap[priceKey(chem, unit, prop?.id)] ?? priceMap[priceKey(chem, unit)] ?? 0
    if (!grouped[key]) grouped[key] = { customer, property: prop?.name || '', chemical: chem, unit, quantity: 0, cost: 0 }
    grouped[key].quantity += qty
    grouped[key].cost += qty * unitPrice
  })
  Object.values(grouped).forEach((g) => chemicals.push(g))

  const { data: jobsCompleted } = await db
    .from('jobs' as any)
    .select('id, title, status, price_cents, completed_at, customer_id, property_id, external_contact, company_id')
    .eq('company_id', companyId)
    .not('completed_at', 'is', null)
    .gte('completed_at', startIso)
    .lte('completed_at', endIso)

  const { data: jobsScheduled } = await db
    .from('jobs' as any)
    .select('id, title, status, price_cents, scheduled_at, customer_id, property_id, external_contact, company_id, completed_at')
    .eq('company_id', companyId)
    .is('completed_at', null)
    .gte('scheduled_at', startIso)
    .lte('scheduled_at', endIso)

  const jobsAll = ([...(jobsCompleted || []), ...(jobsScheduled || [])] as any[])
  const jobsExisting = jobsAll.filter((j) => !!j.customer_id).map((j) => ({
    customer: customerNameById.get(j.customer_id) || 'Unknown',
    property: j.property_id ? (propertyNameById.get(j.property_id) || '') : '',
    title: j.title || '',
    status: (j.status || '').replace('_', ' '),
    price: Number(j.price_cents || 0) / 100,
  }))

  const jobsOneOff = jobsAll.filter((j) => !j.customer_id).map((j) => ({
    contactName: j.external_contact?.name || '',
    contactEmail: j.external_contact?.email || '',
    contactPhone: j.external_contact?.phone || '',
    title: j.title || '',
    status: (j.status || '').replace('_', ' '),
    price: Number(j.price_cents || 0) / 100,
  }))

  return { chemicals, jobsExisting, jobsOneOff }
}
