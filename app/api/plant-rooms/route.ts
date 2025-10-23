import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

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

    const { data: ownedProperty } = await supabase
      .from('properties' as any)
      .select('id, company_id')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .single()
    if (!ownedProperty) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const insert = {
      property_id: propertyId,
      name: payload.name,
      check_frequency: payload.check_frequency || 'daily',
      check_times: payload.check_times || ['09:00'],
      check_days: payload.check_days || null,
      notes: payload.notes ?? null,
      is_active: payload.is_active ?? true,
    }

    const { data, error } = await supabase
      .from('plant_rooms' as any)
      .insert(insert as any)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ plant_room: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
