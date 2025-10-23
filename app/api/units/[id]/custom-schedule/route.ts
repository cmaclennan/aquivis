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

    const { data: owned } = await supabase
      .from('units' as any)
      .select('id, properties!inner(company_id)')
      .eq('id', id)
      .eq('properties.company_id', companyId)
      .single()
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data } = await supabase
      .from('custom_schedules' as any)
      .select('schedule_type, schedule_config, service_types, name, description')
      .eq('unit_id', id)
      .eq('is_active', true)
      .maybeSingle()

    return NextResponse.json({ schedule: data || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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

    const { data: owned } = await supabase
      .from('units' as any)
      .select('id, properties!inner(company_id)')
      .eq('id', id)
      .eq('properties.company_id', companyId)
      .single()
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Delete existing
    await supabase
      .from('custom_schedules' as any)
      .delete()
      .eq('unit_id', id)

    // Insert new
    const { error: upsertError } = await supabase
      .from('custom_schedules' as any)
      .insert({
        unit_id: id,
        schedule_type: payload.schedule_type,
        schedule_config: payload.schedule_config,
        service_types: payload.service_types,
        name: payload.name,
        description: payload.description,
        is_active: true,
      } as any)
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

    // Mark unit as custom frequency
    await supabase
      .from('units' as any)
      .update({ service_frequency: 'custom' } as any)
      .eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
