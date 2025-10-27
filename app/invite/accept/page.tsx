'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'

import { Suspense } from 'react'

function AcceptInviteInner() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const { data: session } = useSession()
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
        if (!session?.user?.id) {
          setStatus('login')
          setMessage('Please sign in or sign up to accept the invite.')
          return
        }
        setStatus('accepting')
        const res = await fetch('/api/invite/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to accept invite')

        if (json?.alreadyAccepted) {
          setStatus('done')
          setMessage('Invite already accepted.')
          router.push('/team')
          return
        }

        setStatus('done')
        setMessage('Invite accepted. Redirecting…')
        router.push('/team')
      } catch (e: any) {
        setStatus('error')
        setMessage(e.message || 'Failed to accept invite')
      }
    })()
  }, [token, router, session])

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

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <AcceptInviteInner />
    </Suspense>
  )
}


