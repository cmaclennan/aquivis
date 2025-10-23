import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function ensureOwned(supabase: any, id: string, companyId: string) {
  const { data } = await supabase
    .from('schedule_templates' as any)
    .select('id, company_id')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()
  return !!data
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

    const owned = await ensureOwned(supabase, id, companyId)
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const payload: any = {}
    if (updates.template_name !== undefined) payload.template_name = updates.template_name
    if (updates.template_type !== undefined) payload.template_type = updates.template_type
    if (updates.template_config !== undefined) payload.template_config = updates.template_config
    if (updates.applicable_unit_types !== undefined) payload.applicable_unit_types = updates.applicable_unit_types
    if (updates.applicable_water_types !== undefined) payload.applicable_water_types = updates.applicable_water_types
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.is_active !== undefined) payload.is_active = !!updates.is_active

    const { error } = await supabase
      .from('schedule_templates' as any)
      .update(payload)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
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

    const owned = await ensureOwned(supabase, id, companyId)
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error } = await supabase
      .from('schedule_templates' as any)
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
