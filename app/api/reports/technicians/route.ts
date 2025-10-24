import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { technicianNames } from '@/lib/data/reports'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const t0 = Date.now()
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { ids } = await req.json().catch(() => ({ ids: [] }))
    const list = Array.isArray(ids) ? ids.filter((x) => typeof x === 'string') : []
    if (!list.length) return NextResponse.json({ map: {} })
    const map = await technicianNames(list)
    const res = NextResponse.json({ map })
    res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
