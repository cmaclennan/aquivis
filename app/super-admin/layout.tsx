import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SuperAdminLayout from '@/components/super-admin/SuperAdminLayout'

export default async function SuperAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  // Check NextAuth session
  const session = await auth()

  if (!session?.user) {
    redirect('/super-admin-login')
  }

  // Check if user is super admin
  if (session.user.role !== 'super_admin') {
    redirect('/super-admin-login')
  }

  return (
    <SuperAdminLayout>
      {children}
    </SuperAdminLayout>
  )
}
