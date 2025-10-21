import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function TeamInvitationsPage() {
  // Get user data from middleware headers
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const companyId = headersList.get('x-user-company-id')

  if (!userId) {
    redirect('/login')
  }

  if (!companyId) {
    redirect('/onboarding')
  }

  const supabase = await createClient()

  const { data: invitations } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Team Invitations</h1>
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pending Invitations</h2>
        </div>
        <div className="p-6">
          {!invitations || invitations.length === 0 ? (
            <p className="text-gray-500">No pending invitations.</p>
          ) : (
            <ul className="space-y-3">
              {invitations.map((inv: any) => (
                <li key={inv.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 text-sm">{inv.email}</p>
                    <p className="text-gray-500 text-xs">Sent {new Date(inv.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-xs rounded-full px-2 py-1 bg-amber-100 text-amber-700">{inv.status || 'pending'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}


