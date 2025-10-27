import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: plantRoomId } = await params
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

    // Ensure plant room belongs to user's company
    const { data: owned } = await supabase
      .from('plant_rooms' as any)
      .select('id, properties!inner(company_id)')
      .eq('id', plantRoomId)
      .eq('properties.company_id', companyId)
      .single()
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const checkDate = new Date().toISOString().slice(0, 10)
    const insertPR = {
      plant_room_id: plantRoomId,
      check_date: checkDate,
      check_time: payload.check_time || '09:00',
      readings: {},
      notes: payload.notes ?? null,
    }

    const { data: prCheck, error: prErr } = await supabase
      .from('plant_room_checks' as any)
      .insert(insertPR as any)
      .select('*')
      .single()
    if (prErr) return NextResponse.json({ error: prErr.message }, { status: 500 })

    const equipment: Array<any> = Array.isArray(payload.equipment) ? payload.equipment : []
    if (equipment.length) {
      const rows = equipment.map((e) => ({
        plant_room_check_id: prCheck.id,
        equipment_id: e.equipment_id,
        status: e.status || 'normal',
        readings: e.readings || {},
        notes: e.notes ?? null,
      }))
      const { error: ecErr } = await supabase
        .from('equipment_checks' as any)
        .insert(rows as any)
      if (ecErr) return NextResponse.json({ error: ecErr.message }, { status: 500 })
    }

    return NextResponse.json({ check: prCheck })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
