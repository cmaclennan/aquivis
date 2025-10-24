import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveCompanyIdForUser } from '@/lib/data/services'
import { createPlantRoomForProperty } from '@/lib/data/plant-rooms'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const t0 = Date.now()
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const payload = await req.json().catch(() => ({}))
    const companyId = await resolveCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const propertyId = payload.property_id
    if (!propertyId) return NextResponse.json({ error: 'property_id is required' }, { status: 400 })
    try {
      const data = await createPlantRoomForProperty(propertyId, companyId, payload)
      const res = NextResponse.json({ plant_room: data })
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
