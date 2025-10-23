import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const { data, error } = await supabase
      .from('units' as any)
      .select(`
        id,
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
      .eq('id', id)
      .eq('properties.company_id', companyId)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let hasBookings = false
    if (data) {
      const { data: bookingExists } = await supabase
        .from('bookings' as any)
        .select('id')
        .eq('unit_id', id)
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

    return NextResponse.json({ unit })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const updates = await req.json().catch(() => ({}))
    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    // Fetch current unit to verify ownership and compute volume delta
    const { data: current } = await supabase
      .from('units' as any)
      .select('id, property_id, volume_litres, properties!inner(company_id)')
      .eq('id', id)
      .eq('properties.company_id', companyId)
      .single()
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const oldVolume = current.volume_litres || 0
    const newVolume = (updates.volume_litres ?? oldVolume) || 0

    const { data, error } = await supabase
      .from('units' as any)
      .update(updates as any)
      .eq('id', id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Adjust property's total volume if changed
    if (newVolume !== oldVolume) {
      const { data: prop } = await supabase
        .from('properties' as any)
        .select('total_volume_litres')
        .eq('id', current.property_id)
        .single()
      const currentTotal = (prop?.total_volume_litres || 0) as number
      const diff = (newVolume || 0) - (oldVolume || 0)
      const updatedTotal = Math.max(0, currentTotal + diff)
      await supabase
        .from('properties' as any)
        .update({ total_volume_litres: updatedTotal } as any)
        .eq('id', current.property_id)
    }

    return NextResponse.json({ unit: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    // Fetch current unit for volume and ownership
    const { data: current } = await supabase
      .from('units' as any)
      .select('id, property_id, volume_litres, properties!inner(company_id)')
      .eq('id', id)
      .eq('properties.company_id', companyId)
      .single()
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const oldVolume = current.volume_litres || 0

    const { error } = await supabase
      .from('units' as any)
      .delete()
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (oldVolume) {
      const { data: prop } = await supabase
        .from('properties' as any)
        .select('total_volume_litres')
        .eq('id', current.property_id)
        .single()
      const currentTotal = (prop?.total_volume_litres || 0) as number
      const newTotal = Math.max(0, currentTotal - (oldVolume || 0))
      await supabase
        .from('properties' as any)
        .update({ total_volume_litres: newTotal } as any)
        .eq('id', current.property_id)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
