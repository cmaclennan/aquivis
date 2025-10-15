import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Building2, TrendingUp, Users, UserCircle, LogOut, Droplets, Settings, BarChart3, Calendar } from 'lucide-react'

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
    <div className="flex min-h-screen app-surface">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-white/95 backdrop-blur border-r border-gray-300 shadow-lg z-10">
        {/* Logo & Company Name */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 flex-shrink-0 relative">
              <Image 
                src="/logo-192.png" 
                alt="Aquivis Logo" 
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">Aquivis</h1>
              <p className="text-xs text-gray-500 truncate">{profile.companies?.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/properties"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Building2 className="h-5 w-5" />
            <span>Properties</span>
          </Link>
          <Link
            href="/customers"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <UserCircle className="h-5 w-5" />
            <span>Customers</span>
          </Link>
          <Link
            href="/schedule"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Calendar className="h-5 w-5" />
            <span>Schedule</span>
          </Link>
          <Link
            href="/management"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Management</span>
          </Link>
          <Link
            href="/services"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Droplets className="h-5 w-5" />
            <span>Services</span>
          </Link>
          <Link
            href="/jobs"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <TrendingUp className="h-5 w-5" />
            <span>Jobs</span>
          </Link>
          <Link
            href="/reports"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Reports</span>
          </Link>
          {(profile.role === 'owner' || profile.role === 'super_admin') && (
            <Link
              href="/settings"
              className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          )}
        </nav>

        {/* User Profile - Fixed at bottom */}
        <div className="p-3 border-t border-gray-100">
          <div className="rounded-lg bg-primary-50 p-3">
            <div className="flex items-center justify-between">
              <Link
                href="/profile"
                className="min-w-0 flex-1 hover:bg-primary-100 rounded p-1 -m-1 transition-colors"
              >
                <p className="font-medium text-primary-700 text-sm truncate">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className="text-xs text-primary-600 capitalize truncate">{profile.role}</p>
              </Link>
              <Link
                href="/logout"
                className="flex-shrink-0 ml-2 text-primary-600 hover:text-primary-700 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
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

