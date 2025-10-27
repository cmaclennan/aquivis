import { createAdminClient } from '@/lib/supabase/admin'

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

const unitsCache: Map<string, { data: any[]; at: number }> = new Map()
const UNITS_TTL_MS = 30_000

export async function ensureUnitOwnedByCompany(unitId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data } = await db
    .from('units' as any)
    .select('id, properties!inner(company_id)')
    .eq('id', unitId)
    .eq('properties.company_id', companyId)
    .single()
  return !!data
}

export async function listUnitsForCompany(companyId: string, filters: { propertyId?: string } = {}, supabase?: Supa) {
  const db = getAdmin(supabase)
  const key = `${companyId}::${filters.propertyId || ''}`
  const now = Date.now()
  const cached = unitsCache.get(key)
  if (cached && now - cached.at < UNITS_TTL_MS) return cached.data
  let query = db
    .from('units' as any)
    .select(`
      id,
      name,
      unit_type,
      water_type,
      properties!inner(id, name, company_id)
    `)
    .eq('properties.company_id', companyId)
    .order('name')

  if (filters.propertyId) query = query.eq('properties.id', filters.propertyId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  const normalized = (data || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    unit_type: u.unit_type,
    water_type: u.water_type,
    property: Array.isArray(u.properties) ? u.properties[0] : u.properties,
  }))
  unitsCache.set(key, { data: normalized, at: now })
  return normalized
}

export async function createUnitForCompany(companyId: string, payload: any, supabase?: Supa) {
  const db = getAdmin(supabase)
  const propertyId = payload?.property_id
  if (!propertyId) throw new Error('property_id is required')

  const { data: ownedProperty } = await db
    .from('properties' as any)
    .select('id, company_id, total_volume_litres')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .single()
  if (!ownedProperty) throw new Error('Not found')

  const insert = {
    property_id: propertyId,
    unit_number: payload.unit_number ?? payload.unitNumber ?? null,
    name: payload.name ?? null,
    unit_type: payload.unit_type,
    water_type: payload.water_type,
    volume_litres: payload.volume_litres ?? null,
    depth_meters: payload.depth_meters ?? null,
    billing_entity: payload.billing_entity ?? 'property',
    customer_id: payload.customer_id || null,
    service_frequency: payload.service_frequency ?? null,
    last_service_warning_days: payload.last_service_warning_days ?? null,
    risk_category: payload.risk_category ?? null,
    is_active: payload.is_active ?? true,
    notes: payload.notes ?? null,
  }

  const { data, error } = await db
    .from('units' as any)
    .insert(insert as any)
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  if (insert.volume_litres) {
    const newTotal = (ownedProperty.total_volume_litres || 0) + (insert.volume_litres || 0)
    await db
      .from('properties' as any)
      .update({ total_volume_litres: newTotal } as any)
      .eq('id', propertyId)
  }

  return data
}

export async function getUnitByIdForCompany(unitId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data, error } = await db
    .from('units' as any)
    .select(`
      id,
      created_at,
      unit_number,
      name,
      unit_type,
      water_type,
      volume_litres,
      billing_entity,
      customer_id,
      notes,
      service_frequency,
      properties!inner(id, name, company_id)
    `)
    .eq('id', unitId)
    .eq('properties.company_id', companyId)
    .single()
  if (error) throw new Error(error.message)

  let hasBookings = false
  if (data) {
    const { data: bookingExists } = await db
      .from('bookings' as any)
      .select('id')
      .eq('unit_id', unitId)
      .limit(1)
    hasBookings = !!(bookingExists && bookingExists.length)
  }

  const unit = data
    ? {
        id: data.id,
        unit_number: data.unit_number,
        name: data.name,
        unit_type: data.unit_type,
        water_type: data.water_type,
        volume_litres: data.volume_litres,
        billing_entity: data.billing_entity,
        customer_id: data.customer_id,
        notes: data.notes,
        service_frequency: data.service_frequency,
        has_bookings: hasBookings,
        property: Array.isArray(data.properties) ? data.properties[0] : data.properties,
      }
    : null

  return unit
}

export async function updateUnitForCompany(unitId: string, updates: any, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data: current } = await db
    .from('units' as any)
    .select('id, property_id, volume_litres, properties!inner(company_id)')
    .eq('id', unitId)
    .eq('properties.company_id', companyId)
    .single()
  if (!current) throw new Error('Not found')

  const oldVolume = current.volume_litres || 0
  const newVolume = (updates.volume_litres ?? oldVolume) || 0

  const { data, error } = await db
    .from('units' as any)
    .update(updates as any)
    .eq('id', unitId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  if (newVolume !== oldVolume) {
    const { data: prop } = await db
      .from('properties' as any)
      .select('total_volume_litres')
      .eq('id', current.property_id)
      .single()
    const currentTotal = (prop?.total_volume_litres || 0) as number
    const diff = (newVolume || 0) - (oldVolume || 0)
    const updatedTotal = Math.max(0, currentTotal + diff)
    await db
      .from('properties' as any)
      .update({ total_volume_litres: updatedTotal } as any)
      .eq('id', current.property_id)
  }

  return data
}

export async function deleteUnitForCompany(unitId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data: current } = await db
    .from('units' as any)
    .select('id, property_id, volume_litres, properties!inner(company_id)')
    .eq('id', unitId)
    .eq('properties.company_id', companyId)
    .single()
  if (!current) throw new Error('Not found')

  const oldVolume = current.volume_litres || 0

  const { error } = await db
    .from('units' as any)
    .delete()
    .eq('id', unitId)
  if (error) throw new Error(error.message)

  if (oldVolume) {
    const { data: prop } = await db
      .from('properties' as any)
      .select('total_volume_litres')
      .eq('id', current.property_id)
      .single()
    const currentTotal = (prop?.total_volume_litres || 0) as number
    const newTotal = Math.max(0, currentTotal - (oldVolume || 0))
    await db
      .from('properties' as any)
      .update({ total_volume_litres: newTotal } as any)
      .eq('id', current.property_id)
  }

  return true
}

export async function getActiveCustomScheduleForUnit(unitId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureUnitOwnedByCompany(unitId, companyId, db)
  if (!owned) throw new Error('Not found')
  const { data } = await db
    .from('custom_schedules' as any)
    .select('schedule_type, schedule_config, service_types, name, description')
    .eq('unit_id', unitId)
    .eq('is_active', true)
    .maybeSingle()
  return data || null
}

export async function upsertCustomScheduleForUnit(unitId: string, payload: any, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureUnitOwnedByCompany(unitId, companyId, db)
  if (!owned) throw new Error('Not found')
  await db
    .from('custom_schedules' as any)
    .delete()
    .eq('unit_id', unitId)
  const { error: upsertError } = await db
    .from('custom_schedules' as any)
    .insert({
      unit_id: unitId,
      schedule_type: payload.schedule_type,
      schedule_config: payload.schedule_config,
      service_types: payload.service_types,
      name: payload.name,
      description: payload.description,
      is_active: true,
    } as any)
  if (upsertError) throw new Error(upsertError.message)
  await db
    .from('units' as any)
    .update({ service_frequency: 'custom' } as any)
    .eq('id', unitId)
  return true
}
