import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { startDate, endDate } = await req.json().catch(() => ({}))
    if (!startDate || !endDate) return NextResponse.json({ error: 'Missing date range' }, { status: 400 })

    const supabase = createAdminClient() as any

    // Resolve company
    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const startIso = `${startDate}T00:00:00.000Z`
    const endIso = `${endDate}T23:59:59.999Z`

    // Load chemical rows
    const { data: chemRows, error: chemErr } = await supabase
      .from('chemical_additions' as any)
      .select(
        'quantity, unit_of_measure, chemical_type, services!inner(service_date, units!inner(id, customer_id, properties!inner(id, name, customer_id, company_id)))'
      )
      .eq('services.units.properties.company_id', companyId)
      .gte('services.service_date', startIso)
      .lte('services.service_date', endIso)

    if (chemErr) return NextResponse.json({ error: chemErr.message }, { status: 500 })

    // Load pricebook (global + property overrides)
    const { data: prices } = await supabase
      .from('company_chemical_prices' as any)
      .select('chemical_code, unit, price_per_unit, property_id')
      .eq('company_id', companyId)

    const priceKey = (code: string, unit: string, propertyId?: string) => `${propertyId || 'all'}::${code}::${unit}`
    const priceMap: Record<string, number> = {}
    ;(prices || []).forEach((p: any) => {
      priceMap[priceKey(p.chemical_code, p.unit, p.property_id || undefined)] = Number(p.price_per_unit)
    })

    // Lookups for names
    const [{ data: customers }, { data: properties }] = await Promise.all([
      supabase.from('customers' as any).select('id, name').eq('company_id', companyId),
      supabase.from('properties' as any).select('id, name').eq('company_id', companyId),
    ])
    const customerNameById = new Map<string, string>((customers || []).map((c: any) => [c.id, c.name]))
    const propertyNameById = new Map<string, string>((properties || []).map((p: any) => [p.id, p.name]))

    type Key = string
    const chemicals: Array<{ customer: string; property: string; chemical: string; unit: string; quantity: number; cost: number }> = []
    const grouped: Record<Key, { customer: string; property: string; chemical: string; unit: string; quantity: number; cost: number }> = {}

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

    // Jobs
    const { data: jobsCompleted } = await supabase
      .from('jobs' as any)
      .select('id, title, status, price_cents, completed_at, customer_id, property_id, external_contact, company_id')
      .eq('company_id', companyId)
      .not('completed_at', 'is', null)
      .gte('completed_at', startIso)
      .lte('completed_at', endIso)

    const { data: jobsScheduled } = await supabase
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

    return NextResponse.json({ chemicals, jobsExisting, jobsOneOff })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
