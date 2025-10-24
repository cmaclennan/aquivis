import { createAdminClient } from '@/lib/supabase/admin'

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

export async function createTeamInvitation(companyId: string, invitedBy: string, email: string, role: 'owner'|'manager'|'technician'|'customer', customerId?: string|null, supabase?: Supa) {
  const db = getAdmin(supabase)
  let linkedCustomerId: string | null = null
  if (role === 'customer' && customerId) {
    const { data: cust } = await db
      .from('customers' as any)
      .select('id')
      .eq('id', customerId)
      .eq('company_id', companyId)
      .single()
    linkedCustomerId = cust ? customerId : null
  }
  const insert = {
    company_id: companyId,
    email: String(email).trim(),
    role,
    invited_by: invitedBy,
    customer_id: role === 'customer' ? linkedCustomerId : null,
  }
  const { data, error } = await db
    .from('team_invitations' as any)
    .insert(insert as any)
    .select('token')
    .single()
  if (error) throw new Error(error.message)
  return data?.token as string | undefined
}
