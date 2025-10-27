import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Users, UserPlus, Mail, Phone, Calendar, Shield } from 'lucide-react'
import Link from 'next/link'

export default async function TeamPage() {
  // Get user data from middleware headers
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')
  const companyId = headersList.get('x-user-company-id')

  if (!userId) {
    redirect('/login')
  }

  if (!companyId) {
    redirect('/onboarding')
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', userId)
    .single()

  // Get all team members for this company
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const canManageTeam = userRole === 'owner' || userRole === 'manager'

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="mt-2 text-gray-600">
              Manage your team members and their access levels
            </p>
          </div>
          {canManageTeam && (
            <div className="flex items-center gap-3">
              <Link
                href="/team/invitations"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View Invitations
              </Link>
              <Link
                href="/team/invite"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Team Member
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5 mb-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{teamMembers?.length || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Owners</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {teamMembers?.filter(m => m.role === 'owner').length || 0}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Managers</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {teamMembers?.filter(m => String(m.role) === 'manager').length || 0}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Technicians</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {teamMembers?.filter(m => m.role === 'technician').length || 0}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Customers</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {teamMembers?.filter(m => String(m.role) === 'customer').length || 0}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                {canManageTeam && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers?.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      String(member.role) === 'owner' 
                        ? 'bg-purple-100 text-purple-800'
                        : String(member.role) === 'manager'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-4">
                      {member.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-1" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  {canManageTeam && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <a
                          href={`/team/${member.id}/edit`}
                          className="text-primary hover:text-primary-600"
                        >
                          Edit
                        </a>
                        {member.role !== 'owner' && (
                          <form action={async () => {
                            'use server'
                            const supabase = createAdminClient()
                            // Soft-remove: clear company_id to detach from team
                            await supabase.from('profiles').update({ company_id: null }).eq('id', member.id)
                          }}>
                            <button className="text-red-600 hover:text-red-900" type="submit">
                            Remove
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(!teamMembers || teamMembers.length === 0) && (
        <div className="mt-8 text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No team members yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canManageTeam 
              ? "Start building your team by inviting members."
              : "Your team will appear here once members are added."
            }
          </p>
          {canManageTeam && (
            <div className="mt-6">
              <Link
                href="/team/invite"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Your First Team Member
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

