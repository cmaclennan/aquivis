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
    const start = url.searchParams.get('start') || ''
    const end = url.searchParams.get('end') || ''
    const propertyId = url.searchParams.get('propertyId') || ''
    const technicianId = url.searchParams.get('technicianId') || ''

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    // Properties and technicians
    const [{ data: props }, { data: techs }] = await Promise.all([
      supabase.from('properties' as any).select('id, name').eq('company_id', companyId).order('name'),
      supabase.from('profiles' as any).select('id, first_name, last_name, role').eq('company_id', companyId)
    ])

    // Services within range
    let servicesQuery = supabase
      .from('services' as any)
      .select('id, service_date, service_type, status, technician_id, units!inner(name, properties!inner(id, name, company_id))')
      .eq('units.properties.company_id', companyId)
    if (start) servicesQuery = servicesQuery.gte('service_date', start)
    if (end) servicesQuery = servicesQuery.lte('service_date', end)
    if (propertyId) servicesQuery = servicesQuery.eq('units.properties.id', propertyId)
    if (technicianId) servicesQuery = servicesQuery.eq('technician_id', technicianId)
    const { data: services } = await servicesQuery

    const totalServices = services?.length || 0
    const completedToday = (services || []).filter((s: any) => s.status === 'completed').length
    const pendingToday = (services || []).filter((s: any) => s.status !== 'completed').length

    // Water tests within range
    let testsQuery = supabase
      .from('water_tests' as any)
      .select('id, services!inner(service_date, units!inner(properties!inner(company_id, id)))')
      .eq('services.units.properties.company_id', companyId)
    if (start) testsQuery = testsQuery.gte('services.service_date', start)
    if (end) testsQuery = testsQuery.lte('services.service_date', end)
    if (propertyId) testsQuery = testsQuery.eq('services.units.properties.id', propertyId)
    const { data: tests } = await testsQuery
    const testsToday = tests?.length || 0

    // Recent activity (latest 20 services)
    let activityQuery = supabase
      .from('services' as any)
      .select('id, service_date, service_type, status, units(name, properties(name)), technician_id')
      .eq('units.properties.company_id', companyId)
      .order('service_date', { ascending: false })
      .limit(20)
    if (start) activityQuery = activityQuery.gte('service_date', start)
    if (end) activityQuery = activityQuery.lte('service_date', end)
    if (propertyId) activityQuery = activityQuery.eq('units.properties.id', propertyId)
    if (technicianId) activityQuery = activityQuery.eq('technician_id', technicianId)
    const { data: acts } = await activityQuery

    const technicians = (techs || [])
      .filter((t: any) => ['technician', 'tech', 'staff'].includes((t.role || '').toLowerCase()))
      .map((t: any) => ({ id: t.id, name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Technician' }))

    return NextResponse.json({
      properties: props || [],
      technicians,
      kpi: { totalServices, completedToday, pendingToday, testsToday },
      activities: acts || [],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
