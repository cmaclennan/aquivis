import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { startDate, endDate, property } = body || {}

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const startIso = `${startDate}T00:00:00.000Z`
    const endIso = `${endDate}T23:59:59.999Z`

    let query = supabase
      .from('equipment_maintenance_logs' as any)
      .select('maintenance_date, maintenance_time, actions, notes, equipment:equipment_id(name, properties!inner(id, name, company_id))')
      .eq('equipment.properties.company_id', companyId)
      .gte('maintenance_date', startDate)
      .lte('maintenance_date', endDate)
      .order('maintenance_date', { ascending: false })

    if (property) query = query.eq('equipment.properties.id', property)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ logs: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
