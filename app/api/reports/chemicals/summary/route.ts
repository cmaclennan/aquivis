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
    const { dateRange, startDate, endDate } = body || {}

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    let query = supabase
      .from('chemical_additions' as any)
      .select('chemical_type, unit_of_measure, quantity, services!inner(service_date, units!inner(properties!inner(company_id)))')
      .eq('services.units.properties.company_id', companyId)

    if (dateRange === 'custom' && startDate && endDate) {
      query = query
        .gte('services.service_date', `${startDate}T00:00:00.000Z`)
        .lte('services.service_date', `${endDate}T23:59:59.999Z`)
    } else {
      const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30
      const d = new Date()
      d.setDate(d.getDate() - days)
      query = query.gte('services.service_date', d.toISOString())
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const grouped: Record<string, { quantity: number; unit: string }> = {}
    ;(data || []).forEach((row: any) => {
      const key = row.chemical_type || 'unknown'
      if (!grouped[key]) grouped[key] = { quantity: 0, unit: row.unit_of_measure || '' }
      grouped[key].quantity += Number(row.quantity || 0)
      grouped[key].unit = row.unit_of_measure || grouped[key].unit
    })

    return NextResponse.json({ totals: grouped })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
