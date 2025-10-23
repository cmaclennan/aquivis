import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const url = new URL(req.url)
    const status = url.searchParams.get('status') || ''
    const jobType = url.searchParams.get('jobType') || ''
    const limit = Number(url.searchParams.get('limit') || '200')

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    let query = supabase
      .from('jobs' as any)
      .select('*')
      .eq('company_id', companyId)
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    if (status) query = query.eq('status', status)
    if (jobType) query = query.eq('job_type', jobType)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ jobs: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

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

    const insert = {
      company_id: companyId,
      title: payload.title,
      job_type: payload.job_type,
      status: payload.status,
      scheduled_at: payload.scheduled_at || null,
      notes: payload.notes ?? null,
      customer_id: payload.customer_id || null,
      external_contact: payload.external_contact || null,
      property_id: payload.property_id || null,
      unit_id: payload.unit_id || null,
      plant_room_id: payload.plant_room_id || null,
      description: payload.description || null,
    }

    const { data, error } = await supabase
      .from('jobs' as any)
      .insert(insert as any)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ job: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
