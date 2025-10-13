'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'

export default function InviteTeamMemberPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'manager' | 'technician' | 'customer'>('technician')
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([])
  const [customerId, setCustomerId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()
        if (!profile?.company_id) return
        const { data: custs } = await supabase
          .from('customers')
          .select('id, name')
          .eq('company_id', profile.company_id)
          .order('name')
        setCustomers(custs || [])
      } catch {}
    })()
  }, [supabase])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Create an invitation row with token
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: me } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      if (!me?.company_id) throw new Error('No company found')

      const { data: invite, error } = await supabase.from('team_invitations').insert({
        company_id: me.company_id,
        email: email.trim(),
        role,
        customer_id: role === 'customer' ? (customerId || null) : null,
        invited_by: user.id,
      }).select('token').single()
      if (error) throw error

      const inviteLink = `${window.location.origin}/invite/accept?token=${invite.token}`
      // Send email via API (server route uses Resend)
      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email.trim(), inviteLink, role, firstName, lastName })
      })
      if (!res.ok) {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(inviteLink)
        toast({ title: 'Invitation created', description: 'Email send failed; link copied to clipboard.' })
      } else {
        toast({ title: 'Invitation sent', description: 'Email delivered to recipient.' })
      }
      router.push('/team')
    } catch (e: any) {
      toast({ title: 'Invite failed', description: e.message || 'Unable to invite user.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <Link href="/team" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Team</span>
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Invite Team Member</h1>

      <div className="max-w-xl">
        <form onSubmit={handleInvite} className="rounded-lg bg-white p-6 shadow space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="technician">Technician</option>
              <option value="manager">Manager</option>
              <option value="customer">Customer (Portal)</option>
            </select>
          </div>

          {role === 'customer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Link to Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="">Select a customer (optional)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">If selected, the invite will be associated with this customer.</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3">
            <Link href="/team" className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



