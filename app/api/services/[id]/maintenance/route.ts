import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const tasks = Array.isArray(body?.tasks) ? body.tasks : []

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    // Validate service belongs to company
    const { data: owned } = await supabase
      .from('services' as any)
      .select('id, units!inner(properties!inner(company_id))')
      .eq('id', id)
      .eq('units.properties.company_id', companyId)
      .single()
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!tasks.length) return NextResponse.json({ inserted: 0 })

    const rows = tasks.map((t: any) => ({
      service_id: id,
      task_type: t.task_type || t.taskType,
      completed: !!t.completed,
      notes: t.notes || null,
    }))

    const { data, error } = await supabase
      .from('maintenance_tasks' as any)
      .insert(rows as any)
      .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ inserted: (data || []).length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
