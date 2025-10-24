import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveCompanyIdForUser } from '@/lib/data/services'
import { equipmentLogsReport } from '@/lib/data/reports'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const t0 = Date.now()
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { startDate, endDate, property } = body || {}

    const companyId = await resolveCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })
    try {
      const data = await equipmentLogsReport(companyId, startDate, endDate, property)
      const res = NextResponse.json({ logs: data })
      res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
      return res
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
