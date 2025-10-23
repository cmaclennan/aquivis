import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { ids } = await req.json().catch(() => ({ ids: [] }))
    const list = Array.isArray(ids) ? ids.filter((x) => typeof x === 'string') : []
    if (!list.length) return NextResponse.json({ map: {} })

    const supabase = createAdminClient() as any
    const { data } = await supabase
      .from('profiles' as any)
      .select('id, first_name, last_name')
      .in('id', list)

    const map: Record<string, string> = {}
    ;(data || []).forEach((t: any) => {
      const name = `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Technician'
      map[t.id] = name
    })

    return NextResponse.json({ map })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
