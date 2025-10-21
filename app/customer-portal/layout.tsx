import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SessionTimeoutWrapper } from '@/components/auth/SessionTimeoutWrapper'

export default async function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check NextAuth session
  const session = await auth()

  if (!session?.user) {
    redirect('/customer-portal/login')
  }

  return (
    <SessionTimeoutWrapper timeoutMinutes={60} warningMinutes={5}>
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
                <span className="text-sm text-gray-600 hidden sm:block">{profile.email}</span>
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
    </SessionTimeoutWrapper>
  )
}


