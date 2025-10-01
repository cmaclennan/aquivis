import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user profile and company
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span className="text-xl text-white">🌊</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Aquivis</h1>
              <p className="text-xs text-gray-500">{profile.companies?.name}</p>
            </div>
          </div>
        </div>

        <nav className="px-3">
          <a
            href="/dashboard"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            <span>📊</span>
            <span>Dashboard</span>
          </a>
          <a
            href="/properties"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            <span>🏢</span>
            <span>Properties</span>
          </a>
          {profile.role === 'owner' && (
            <>
              <a
                href="/reports"
                className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span>📈</span>
                <span>Reports</span>
              </a>
              <a
                href="/team"
                className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span>👥</span>
                <span>Team</span>
              </a>
            </>
          )}
        </nav>

        <div className="absolute bottom-6 left-3 right-3">
          <div className="rounded-lg bg-primary-50 p-3 text-sm">
            <p className="font-medium text-primary-700">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-primary-600">{profile.role}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

