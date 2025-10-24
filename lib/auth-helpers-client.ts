'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Get authenticated user data from NextAuth session (client components)
 * Returns null if not authenticated, redirects to login
 */
export function useAuthUser() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading' || !session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email || '',
    role: session.user.role,
    company_id: session.user.company_id || null,
  }
}

/**
 * Get authenticated user with company requirement (client components)
 * Redirects to onboarding if no company
 */
export function useAuthUserWithCompany() {
  const user = useAuthUser()
  const router = useRouter()

  useEffect(() => {
    if (user && !user.company_id) {
      router.push('/onboarding')
    }
  }, [user, router])

  if (!user || !user.company_id) {
    return null
  }

  return {
    ...user,
    company_id: user.company_id as string,
  }
}

