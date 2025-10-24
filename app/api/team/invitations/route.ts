import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveCompanyIdForUser } from '@/lib/data/services'
import { createTeamInvitation } from '@/lib/data/team'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const t0 = Date.now()
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { email, role, customerId } = await req.json().catch(() => ({}))
    if (!email || !String(email).trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    const normalizedRole = (role || 'technician') as 'owner' | 'manager' | 'technician' | 'customer'
    if (!['owner', 'manager', 'technician', 'customer'].includes(normalizedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const companyId = await resolveCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    try {
      const token = await createTeamInvitation(companyId, userId, email, normalizedRole, customerId)
      const res = NextResponse.json({ token })
      res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
      return res
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
