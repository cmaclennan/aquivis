import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveCompanyIdForUser, addMaintenanceTasksForService } from '@/lib/data/services'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const t0 = Date.now()
    const { id } = await params
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const tasks = Array.isArray(body?.tasks) ? body.tasks : []
    const companyId = await resolveCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })
    try {
      const inserted = await addMaintenanceTasksForService(id, tasks, companyId)
      const res = NextResponse.json({ inserted })
      res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
      return res
    } catch (err: any) {
      const status = err?.message === 'Not found' ? 404 : 400
      return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
