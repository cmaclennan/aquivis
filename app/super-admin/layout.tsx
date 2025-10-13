import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminLayout from '@/components/super-admin/SuperAdminLayout'

export default async function SuperAdminLayoutWrapper({
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

  // Get user profile and check if super admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    redirect('/super-admin-login')
  }

  return (
    <SuperAdminLayout>
      {children}
    </SuperAdminLayout>
  )
}
