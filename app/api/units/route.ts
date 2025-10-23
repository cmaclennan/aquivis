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

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    let query = supabase
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

    if (propertyId) query = query.eq('properties.id', propertyId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Normalize property relation from join array to object if needed
    const normalized = (data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      unit_type: u.unit_type,
      water_type: u.water_type,
      property: Array.isArray(u.properties) ? u.properties[0] : u.properties,
    }))

    return NextResponse.json({ units: normalized })
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

    const propertyId = payload.property_id
    if (!propertyId) return NextResponse.json({ error: 'property_id is required' }, { status: 400 })

    // Verify property ownership
    const { data: ownedProperty } = await supabase
      .from('properties' as any)
      .select('id, company_id, total_volume_litres')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .single()
    if (!ownedProperty) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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

    const { data, error } = await supabase
      .from('units' as any)
      .insert(insert as any)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Update property total volume if provided
    if (insert.volume_litres) {
      const newTotal = (ownedProperty.total_volume_litres || 0) + (insert.volume_litres || 0)
      await supabase
        .from('properties' as any)
        .update({ total_volume_litres: newTotal } as any)
        .eq('id', propertyId)
    }

    return NextResponse.json({ unit: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
