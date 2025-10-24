import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listServicesForCompany, createServiceForCompany, resolveCompanyIdForUser } from '@/lib/data/services'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const t0 = Date.now()
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const url = new URL(req.url)
    const propertyId = url.searchParams.get('propertyId') || ''
    const unitId = url.searchParams.get('unitId') || ''
    const startDate = url.searchParams.get('startDate') || ''
    const endDate = url.searchParams.get('endDate') || ''
    const serviceType = url.searchParams.get('serviceType') || ''
    const status = url.searchParams.get('status') || ''
    const limit = Number(url.searchParams.get('limit') || '0')

    const companyId = await resolveCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const services = await listServicesForCompany(companyId, {
      propertyId: propertyId || undefined,
      unitId: unitId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      serviceType: serviceType || undefined,
      status: status || undefined,
      limit: limit || undefined,
    })

    const res = NextResponse.json({ services })
    res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const t0 = Date.now()
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const payload = await req.json().catch(() => ({}))
    const companyId = await resolveCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    try {
      const service = await createServiceForCompany(companyId, payload, userId)
      const res = NextResponse.json({ service })
      res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
      return res
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
