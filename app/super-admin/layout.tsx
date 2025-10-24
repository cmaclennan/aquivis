import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import SuperAdminLayout from '@/components/super-admin/SuperAdminLayout'

export default async function SuperAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  // Get user data from middleware headers
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userRole = headersList.get('x-user-role')

  // If no user data in headers, middleware didn't authenticate
  if (!userId) {
    redirect('/super-admin-login')
  }

  // Check if user is super admin
  if (userRole !== 'super_admin') {
    redirect('/super-admin-login')
  }

  return (
    <SuperAdminLayout>
      {children}
    </SuperAdminLayout>
  )
}
