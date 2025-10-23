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
    const plantRoomId = url.searchParams.get('plantRoomId') || ''
    const equipmentType = url.searchParams.get('equipmentType') || ''
    const status = url.searchParams.get('status') || ''

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    let query = supabase
      .from('equipment' as any)
      .select(`
        id,
        name,
        equipment_type,
        category,
        manufacturer,
        model,
        serial_number,
        status,
        install_date,
        maintenance_frequency,
        maintenance_times,
        maintenance_scheduled,
        measurement_config,
        measurement_type,
        is_active,
        notes,
        property_id,
        unit_id,
        plant_room_id,
        properties!inner(id, name, company_id),
        units(id, name),
        plant_rooms(id, name)
      `)
      .eq('properties.company_id', companyId)
      .order('name', { ascending: true })

    if (propertyId) query = query.eq('property_id', propertyId)
    if (unitId) query = query.eq('unit_id', unitId)
    if (plantRoomId) query = query.eq('plant_room_id', plantRoomId)
    if (equipmentType) query = query.eq('equipment_type', equipmentType)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ equipment: data || [] })
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
      .select('id, company_id')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .single()
    if (!ownedProperty) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Optional: verify unit or plant room belong to property
    if (payload.unit_id) {
      const { data: unit } = await supabase
        .from('units' as any)
        .select('id, property_id')
        .eq('id', payload.unit_id)
        .eq('property_id', propertyId)
        .single()
      if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }
    if (payload.plant_room_id) {
      const { data: pr } = await supabase
        .from('plant_rooms' as any)
        .select('id, property_id')
        .eq('id', payload.plant_room_id)
        .eq('property_id', propertyId)
        .single()
      if (!pr) return NextResponse.json({ error: 'Plant room not found' }, { status: 404 })
    }

    const insert = {
      property_id: propertyId,
      unit_id: payload.unit_id || null,
      plant_room_id: payload.plant_room_id || null,
      equipment_type: payload.equipment_type || payload.category || 'other',
      name: payload.name,
      category: payload.category || null,
      maintenance_frequency: payload.maintenance_frequency || null,
      maintenance_times: payload.maintenance_times || null,
      maintenance_scheduled: payload.maintenance_scheduled ?? null,
      measurement_config: payload.measurement_config || null,
      measurement_type: payload.measurement_type || null,
      is_active: payload.is_active ?? true,
      notes: payload.notes ?? null,
    }

    const { data, error } = await supabase
      .from('equipment' as any)
      .insert(insert as any)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ equipment: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

