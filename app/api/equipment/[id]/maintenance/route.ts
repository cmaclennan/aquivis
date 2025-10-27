import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { isEquipmentOwnedByCompany, listMaintenanceLogs, createMaintenanceLog, resolveCompanyIdForUser } from '@/lib/data/equipment'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const t0 = Date.now()
    const { id } = await params
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const companyId = await resolveCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    // Ensure equipment belongs to company
    const owned = await isEquipmentOwnedByCompany(id, companyId)
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = await listMaintenanceLogs(id)
    const res = NextResponse.json({ logs: data || [] })
    res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

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

    const payload = await req.json().catch(() => ({}))
    const companyId = await resolveCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const owned = await isEquipmentOwnedByCompany(id, companyId)
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    try {
      const data = await createMaintenanceLog(id, payload, userId)
      const res = NextResponse.json({ log: data })
      res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
      return res
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

