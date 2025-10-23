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

    // Resolve company
    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const { data, error } = await supabase
      .from('services' as any)
      .select(`
        id,
        service_date,
        service_type,
        status,
        notes,
        created_at,
        updated_at,
        unit:units(
          id,
          name,
          unit_type,
          properties(id, name, address, customer_id, company_id)
        ),
        property:properties(id, name),
        water_tests(
          id,
          ph,
          chlorine,
          total_chlorine,
          free_chlorine,
          alkalinity,
          calcium_hardness,
          cyanuric_acid,
          phosphates,
          salt,
          temperature,
          tds,
          notes,
          created_at
        ),
        chemical_additions:chemical_additions(
          id,
          chemical_type,
          quantity,
          unit_of_measure,
          cost
        ),
        maintenance_tasks(
          id,
          task_type,
          completed,
          notes
        ),
        service_photos(
          id,
          photo_url,
          caption,
          created_at
        )
      `)
      .eq('id', id)
      .eq('units.properties.company_id', companyId)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ service: data })
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

    const { data: owned } = await supabase
      .from('services' as any)
      .select('id, units!inner(properties!inner(company_id))')
      .eq('id', id)
      .eq('units.properties.company_id', companyId)
      .single()
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('services' as any)
      .update(updates as any)
      .eq('id', id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ service: data })
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

    const { data: owned } = await supabase
      .from('services' as any)
      .select('id, units!inner(properties!inner(company_id))')
      .eq('id', id)
      .eq('units.properties.company_id', companyId)
      .single()
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error } = await supabase
      .from('services' as any)
      .delete()
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
