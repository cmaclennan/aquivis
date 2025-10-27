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
    const customerId = url.searchParams.get('customerId') || ''
    const search = url.searchParams.get('search') || ''
    const limit = Number(url.searchParams.get('limit') || '0')

    const supabase = createAdminClient() as any

    // Resolve company
    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    let query = supabase
      .from('properties' as any)
      .select('id, name, address, city, state, zip, customer_id, customers(id, name, email), units(id, name, unit_type)')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (customerId) query = query.eq('customer_id', customerId)
    if (search) query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`)
    if (limit > 0) query = query.limit(limit)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ properties: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const input = await req.json().catch(() => ({}))
    const supabase = createAdminClient() as any

    // Resolve company
    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const payload = { ...input, company_id: input.company_id || companyId }

    const { data, error } = await supabase
      .from('properties' as any)
      .insert(payload)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ property: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
