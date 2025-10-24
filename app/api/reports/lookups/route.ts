import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveCompanyIdForUser } from '@/lib/data/services'
import { lookups } from '@/lib/data/reports'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const t0 = Date.now()
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const companyId = await resolveCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })
    const data = await lookups(companyId)
    const res = NextResponse.json(data)
    res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
