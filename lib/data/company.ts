import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Data Access Layer for company/profile scoped queries.
 * These helpers encapsulate Admin client usage and company scoping.
 */

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

const companyIdCache: Map<string, { id: string | null; at: number }> = new Map()
const COMPANY_ID_TTL_MS = 60_000

export async function getCompanyIdForUser(userId: string, supabase?: Supa): Promise<string | null> {
  const now = Date.now()
  const cached = companyIdCache.get(userId)
  if (cached && now - cached.at < COMPANY_ID_TTL_MS) return cached.id

  const db = getAdmin(supabase)
  const { data } = await db.from('profiles' as any).select('company_id').eq('id', userId).single()
  const id = data?.company_id ?? null
  companyIdCache.set(userId, { id, at: now })
  return id
}

export async function getCompanyById(companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data, error } = await db
    .from('companies' as any)
    .select(
      'id, name, business_type, email, phone, address, city, state, postal_code, subscription_tier, subscription_status'
    )
    .eq('id', companyId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateCompanyById(
  companyId: string,
  updates: Partial<{
    name: string | null
    business_type: string | null
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    postal_code: string | null
  }>,
  supabase?: Supa
) {
  const db = getAdmin(supabase)
  const { error } = await db.from('companies' as any).update(updates as any).eq('id', companyId)
  if (error) throw new Error(error.message)
  return { ok: true }
}
