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
    const propertyId = url.searchParams.get('propertyId') || ''
    if (!propertyId) return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })

    const supabase = createAdminClient() as any
    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    // Verify property ownership
    const { data: prop } = await supabase
      .from('properties' as any)
      .select('id, company_id')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .single()
    if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('property_scheduling_rules' as any)
      .select('id, rule_name, rule_type, rule_config, is_active')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ rules: data || [] })
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
    const propertyId = payload.property_id
    if (!propertyId) return NextResponse.json({ error: 'property_id is required' }, { status: 400 })

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    // Verify property ownership
    const { data: prop } = await supabase
      .from('properties' as any)
      .select('id, company_id')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .single()
    if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const insert = {
      property_id: propertyId,
      rule_name: payload.rule_name || 'Random Selection',
      rule_type: 'random_selection',
      rule_config: payload.rule_config || {},
      is_active: payload.is_active !== false,
    }

    const { data, error } = await supabase
      .from('property_scheduling_rules' as any)
      .insert(insert as any)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ rule: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
