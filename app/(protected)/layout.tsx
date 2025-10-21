'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Protected Layout Component
 * 
 * This layout wraps all protected routes and ensures the user is authenticated.
 * It runs on the client side (in Node.js runtime) which has full cookie support,
 * unlike the Edge Runtime middleware.
 * 
 * Key differences from middleware approach:
 * - Runs in Node.js runtime (full cookie support)
 * - Can properly read and persist cookies
 * - Cleaner error handling
 * - Better debugging capabilities
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()

        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setIsAuthenticated(false)
          setIsLoading(false)
          router.push('/login')
          return
        }

        if (!session) {
          setIsAuthenticated(false)
          setIsLoading(false)
          router.push('/login')
          return
        }

        setIsAuthenticated(true)
        setIsLoading(false)
      } catch (error) {
        setIsAuthenticated(false)
        setIsLoading(false)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    return null
  }

  // Render protected content
  return <>{children}</>
}

