import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const url = new URL(req.url)
    const propertyId = url.searchParams.get('propertyId') || ''
    const unitId = url.searchParams.get('unitId') || ''
    const startDate = url.searchParams.get('startDate') || ''
    const endDate = url.searchParams.get('endDate') || ''
    const serviceType = url.searchParams.get('serviceType') || ''
    const status = url.searchParams.get('status') || ''
    const limit = Number(url.searchParams.get('limit') || '0')

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    let query = supabase
      .from('services' as any)
      .select(`
        id,
        service_date,
        service_type,
        status,
        notes,
        technician:profiles!services_technician_id_fkey(first_name, last_name),
        units(
          id,
          name,
          properties(id, name, address, company_id)
        ),
        water_tests(id, ph, chlorine, bromine, alkalinity, all_parameters_ok, test_time),
        service_chemicals(id, chemical_name, amount)
      `)
      .eq('units.properties.company_id', companyId)
      .order('service_date', { ascending: false })

    if (propertyId) query = query.eq('units.properties.id', propertyId)
    if (unitId) query = query.eq('unit_id', unitId)
    if (startDate) query = query.gte('service_date', startDate)
    if (endDate) query = query.lte('service_date', endDate)
    if (serviceType) query = query.eq('service_type', serviceType)
    if (status) query = query.eq('status', status)
    if (limit > 0) query = query.limit(limit)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ services: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const payload = await req.json().catch(() => ({}))
    const supabase = createAdminClient() as any

    // Resolve company
    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    // Validate target (unit/property) belongs to company
    let ownerOk = false
    if (payload?.property_id) {
      const { data: prop } = await supabase
        .from('properties' as any)
        .select('id')
        .eq('id', payload.property_id)
        .eq('company_id', companyId)
        .single()
      ownerOk = !!prop
    }
    if (!ownerOk && payload?.unit_id) {
      const { data: unit } = await supabase
        .from('units' as any)
        .select('id, properties!inner(company_id)')
        .eq('id', payload.unit_id)
        .eq('properties.company_id', companyId)
        .single()
      ownerOk = !!unit
    }
    if (!ownerOk) return NextResponse.json({ error: 'Invalid target (property/unit)' }, { status: 400 })

    const { data, error } = await supabase
      .from('services' as any)
      .insert(payload as any)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ service: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
