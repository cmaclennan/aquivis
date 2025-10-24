import { createAdminClient } from '@/lib/supabase/admin'

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

export async function listTechniciansForCompany(companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data, error } = await db
    .from('profiles' as any)
    .select('id, first_name, last_name')
    .eq('company_id', companyId)
    .eq('role', 'technician')
    .order('first_name')
  if (error) throw new Error(error.message)
  return data || []
}
