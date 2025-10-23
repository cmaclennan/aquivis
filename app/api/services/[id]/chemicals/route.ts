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
    const additions = Array.isArray(body?.additions) ? body.additions : []

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

    if (!additions.length) return NextResponse.json({ inserted: 0 })

    const rows = additions.map((a: any) => ({
      service_id: id,
      chemical_type: a.chemical_type || a.chemicalType,
      quantity: Number(a.quantity || 0),
      unit_of_measure: a.unit_of_measure || a.unitOfMeasure || '',
      cost: a.cost != null ? Number(a.cost) : undefined,
    }))

    const { data, error } = await supabase
      .from('chemical_additions' as any)
      .insert(rows as any)
      .select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ inserted: (data || []).length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
