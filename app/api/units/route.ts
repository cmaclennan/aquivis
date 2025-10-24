import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listUnitsForCompany, createUnitForCompany } from '@/lib/data/units'
import { resolveCompanyIdForUser } from '@/lib/data/services'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const t0 = Date.now()
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const url = new URL(req.url)
    const propertyId = url.searchParams.get('propertyId') || ''
    const companyId = await resolveCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })
    const units = await listUnitsForCompany(companyId, { propertyId: propertyId || undefined })
    const res = NextResponse.json({ units })
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
      const unit = await createUnitForCompany(companyId, payload)
      const res = NextResponse.json({ unit })
      res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
      return res
    } catch (err: any) {
      if (err?.message === 'Not found') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (err?.message?.includes('property_id is required')) return NextResponse.json({ error: err.message }, { status: 400 })
      return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
