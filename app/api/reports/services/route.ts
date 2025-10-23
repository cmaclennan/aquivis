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
    const { dateRange, startDate, endDate, serviceType, unitType, property, status } = body || {}

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    let query = supabase
      .from('services' as any)
      .select(`
        id,
        service_date,
        service_type,
        status,
        units:units!inner(
          name,
          unit_type,
          properties!inner(id, name, company_id)
        )
      `)
      .eq('units.properties.company_id', companyId)

    // Date filters
    if (dateRange === 'custom' && startDate && endDate) {
      query = query
        .gte('service_date', `${startDate}T00:00:00.000Z`)
        .lte('service_date', `${endDate}T23:59:59.999Z`)
    } else {
      const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30
      const d = new Date()
      d.setDate(d.getDate() - days)
      query = query.gte('service_date', d.toISOString())
    }

    // Other filters
    if (serviceType) query = query.eq('service_type', serviceType)
    if (unitType) query = query.eq('units.unit_type', unitType)
    if (property) query = query.eq('units.properties.id', property)
    if (status) query = query.eq('status', status)

    const { data, error } = await query.order('service_date', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ services: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
