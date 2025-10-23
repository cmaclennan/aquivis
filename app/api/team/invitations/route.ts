import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { email, role, customerId } = await req.json().catch(() => ({}))
    if (!email || !String(email).trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    const normalizedRole = (role || 'technician') as 'owner' | 'manager' | 'technician' | 'customer'
    if (!['owner', 'manager', 'technician', 'customer'].includes(normalizedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = createAdminClient() as any

    // Resolve company
    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()
    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    let linkedCustomerId: string | null = null
    if (normalizedRole === 'customer' && customerId) {
      const { data: cust } = await supabase
        .from('customers' as any)
        .select('id')
        .eq('id', customerId)
        .eq('company_id', companyId)
        .single()
      linkedCustomerId = cust ? customerId : null
    }

    const insert = {
      company_id: companyId,
      email: String(email).trim(),
      role: normalizedRole,
      invited_by: userId,
      customer_id: normalizedRole === 'customer' ? linkedCustomerId : null,
    }

    const { data, error } = await supabase
      .from('team_invitations' as any)
      .insert(insert as any)
      .select('token')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ token: data?.token })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
