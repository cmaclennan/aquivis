import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Ensure equipment belongs to company
    const { data: owned } = await supabase
      .from('equipment' as any)
      .select('id, properties!inner(company_id)')
      .eq('id', id)
      .eq('properties.company_id', companyId)
      .single()
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data, error } = await supabase.rpc('get_equipment_failure_summary', { p_equipment_id: id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ summary: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
