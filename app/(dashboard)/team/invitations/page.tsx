import { createClient } from '@/lib/supabase/server'
import { Copy, X, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

export default async function TeamInvitationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const { data: invites } = await supabase
    .from('team_invitations')
    .select('id, email, role, token, created_at, is_revoked, accepted_at')
    .eq('company_id', profile!.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Invitations</h1>
        <Link href="/team/invite" className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-600">New Invite</Link>
      </div>

      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(invites || []).map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{inv.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700 capitalize">{inv.role}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {inv.is_revoked ? 'Revoked' : inv.accepted_at ? 'Accepted' : 'Pending'}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {!inv.accepted_at && !inv.is_revoked && (
                    <form className="inline-flex items-center gap-3" action={async () => {
                      'use server'
                      const supabase = await createClient()
                      await supabase
                        .from('team_invitations')
                        .update({ is_revoked: true })
                        .eq('id', inv.id)
                    }}>
                      <Link
                        href={`/invite/accept?token=${inv.token}`}
                        className="inline-flex items-center text-primary hover:text-primary-600"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" /> Open Link
                      </Link>
                      <button type="submit" className="inline-flex items-center text-red-600 hover:text-red-800">
                        <X className="h-4 w-4 mr-1" /> Revoke
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


