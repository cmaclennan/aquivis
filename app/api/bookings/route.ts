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
    const start = url.searchParams.get('start') || ''
    const end = url.searchParams.get('end') || ''

    if (!propertyId) return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    // Verify property ownership
    const { data: prop } = await supabase
      .from('properties' as any)
      .select('id, company_id')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .single()
    if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let query = supabase
      .from('bookings' as any)
      .select(`
        id,
        unit_id,
        check_in_date,
        check_out_date,
        unit:units(id, name, unit_type)
      `)
      .eq('unit.property_id', propertyId)
      .order('check_in_date', { ascending: false })

    if (start) query = query.gte('check_in_date', start)
    if (end) query = query.lte('check_out_date', end)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ bookings: data || [] })
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

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const unitId = payload.unit_id
    if (!unitId) return NextResponse.json({ error: 'unit_id is required' }, { status: 400 })
    if (!payload.check_in_date || !payload.check_out_date) return NextResponse.json({ error: 'check_in_date and check_out_date are required' }, { status: 400 })

    // Verify unit belongs to company (via property)
    const { data: unit } = await supabase
      .from('units' as any)
      .select('id, property_id, properties!inner(company_id)')
      .eq('id', unitId)
      .eq('properties.company_id', companyId)
      .single()
    if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 })

    const insert = {
      unit_id: unitId,
      check_in_date: payload.check_in_date,
      check_out_date: payload.check_out_date,
    }

    const { data, error } = await supabase
      .from('bookings' as any)
      .insert(insert as any)
      .select(`
        *,
        unit:units(id, name, unit_type)
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ booking: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
