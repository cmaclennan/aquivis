import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { token } = await req.json().catch(() => ({ token: '' }))
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 400 })
    }

    const supabase = createAdminClient() as any

    // Load invitation
    const { data: invite, error: inviteErr } = await supabase
      .from('team_invitations' as any)
      .select('id, company_id, email, role, customer_id, is_revoked, accepted_at')
      .eq('token', token)
      .single()

    if (inviteErr || !invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    if (invite.is_revoked) return NextResponse.json({ error: 'Invite has been revoked' }, { status: 400 })
    if (invite.accepted_at) return NextResponse.json({ ok: true, alreadyAccepted: true })

    // Attach user to company and role
    const { error: profErr } = await supabase
      .from('profiles' as any)
      .update({ company_id: invite.company_id, role: invite.role } as any)
      .eq('id', userId)
    if (profErr) return NextResponse.json({ error: profErr.message || 'Failed to update profile' }, { status: 500 })

    // Link user to customer if provided; avoid duplicate
    if (invite.customer_id) {
      const { data: existing } = await supabase
        .from('customer_user_links' as any)
        .select('id')
        .eq('customer_id', invite.customer_id)
        .eq('user_id', userId)
        .limit(1)
      if (!existing || existing.length === 0) {
        await supabase
          .from('customer_user_links' as any)
          .insert({ customer_id: invite.customer_id, user_id: userId } as any)
      }
    }

    // Mark invite as accepted
    const { error: accErr } = await supabase
      .from('team_invitations' as any)
      .update({ accepted_at: new Date().toISOString(), accepted_by: userId } as any)
      .eq('id', invite.id)
    if (accErr) return NextResponse.json({ error: accErr.message || 'Failed to mark invite accepted' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
