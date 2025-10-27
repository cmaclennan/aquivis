import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveCompanyIdForUser } from '@/lib/data/services'
import { chemicalsSummary } from '@/lib/data/reports'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const t0 = Date.now()
    const session = await auth()
    const t1 = Date.now()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { dateRange, startDate, endDate } = body || {}
    const companyId = await resolveCompanyIdForUser(userId)
    const t2 = Date.now()
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })
    try {
      const totals = await chemicalsSummary(companyId, { dateRange, startDate, endDate })
      const t3 = Date.now()
      const res = NextResponse.json({ totals })
      const authDur = t1 - t0
      const resolveDur = t2 - t1
      const dbDur = t3 - t2
      const totalDur = Date.now() - t0
      res.headers.set('Server-Timing', `auth;dur=${authDur}, resolve;dur=${resolveDur}, db;dur=${dbDur}, total;dur=${totalDur}`)
      return res
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
