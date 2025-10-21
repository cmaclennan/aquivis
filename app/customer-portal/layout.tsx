import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get user data from middleware headers
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userEmail = headersList.get('x-user-email')

  // If no user data in headers, middleware didn't authenticate
  if (!userId) {
    redirect('/customer-portal/login')
  }

  // Get user profile for display
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', userId)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex gap-8">
                <div className="flex flex-shrink-0 items-center">
                  <a href="/customer-portal" className="text-xl font-bold text-blue-600">
                    Aquivis Customer Portal
                  </a>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <Link
                    href="/customer-portal"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/customer-portal/services"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Services
                  </Link>
                  <a
                    href="/customer-portal/water-tests"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Water Tests
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:block">
                  {profile?.email || userEmail}
                </span>
                <a
                  href="/logout"
                  className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Logout
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
  )
}


