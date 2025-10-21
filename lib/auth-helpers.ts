import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Get authenticated user data from middleware headers (server components)
 * Middleware sets these headers after verifying NextAuth JWT token
 */
export async function getAuthUser() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userEmail = headersList.get('x-user-email')
  const userRole = headersList.get('x-user-role')
  const companyId = headersList.get('x-user-company-id')

  if (!userId) {
    redirect('/login')
  }

  return {
    id: userId,
    email: userEmail || '',
    role: userRole || 'user',
    company_id: companyId || null,
  }
}

/**
 * Get authenticated user with company requirement (server components)
 * Redirects to onboarding if no company
 */
export async function getAuthUserWithCompany() {
  const user = await getAuthUser()

  if (!user.company_id) {
    redirect('/onboarding')
  }

  return {
    ...user,
    company_id: user.company_id as string, // Type narrowing
  }
}

