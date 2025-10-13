'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvitePage() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const supabase = createClient()
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'login' | 'accepting' | 'done' | 'error'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    (async () => {
      try {
        if (!token) {
          setStatus('error')
          setMessage('Invalid invite link')
          return
        }
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setStatus('login')
          setMessage('Please sign in or sign up to accept the invite.')
          return
        }
        setStatus('accepting')
        const { data: invite, error } = await supabase
          .from('team_invitations')
          .select('id, company_id, email, role, customer_id, is_revoked, accepted_at')
          .eq('token', token)
          .single()
        if (error || !invite) throw new Error('Invite not found')
        if (invite.is_revoked) throw new Error('Invite has been revoked')
        if (invite.accepted_at) {
          setStatus('done')
          setMessage('Invite already accepted.')
          router.push('/team')
          return
        }

        // Attach user to company and mark invite accepted
        const { error: upErr } = await supabase
          .from('profiles')
          .update({ company_id: invite.company_id, role: invite.role })
          .eq('id', user.id)
        if (upErr) throw upErr

        // Link user to customer if provided
        if (invite.customer_id && user.id) {
          await supabase
            .from('customer_user_links')
            .insert({ customer_id: invite.customer_id, user_id: user.id })
        }

        const { error: accErr } = await supabase
          .from('team_invitations')
          .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
          .eq('id', invite.id)
        if (accErr) throw accErr

        setStatus('done')
        setMessage('Invite accepted. Redirecting…')
        router.push('/team')
      } catch (e: any) {
        setStatus('error')
        setMessage(e.message || 'Failed to accept invite')
      }
    })()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-xl font-semibold mb-2">Team Invitation</h1>
        <p className="text-gray-700 mb-4">{message || 'Validating invitation…'}</p>
        {status === 'login' && (
          <div className="space-x-3">
            <a href={`/login?redirect=/invite/accept?token=${token}`} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-600">Sign in</a>
            <a href={`/signup?redirect=/invite/accept?token=${token}`} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50">Create account</a>
          </div>
        )}
      </div>
    </div>
  )
}


