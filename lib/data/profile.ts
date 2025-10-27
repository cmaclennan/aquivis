import { createAdminClient } from '@/lib/supabase/admin'

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

export async function getProfileForUser(userId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data, error } = await db
    .from('profiles' as any)
    .select('first_name, last_name, phone')
    .eq('id', userId)
    .single()
  if (error) throw new Error(error.message)
  return data || null
}

export async function updateProfileForUser(userId: string, updates: any, supabase?: Supa) {
  const db = getAdmin(supabase)
  const payload = {
    first_name: updates.first_name ?? null,
    last_name: updates.last_name ?? null,
    phone: updates.phone ?? null,
  } as any
  const { error } = await db
    .from('profiles' as any)
    .update(payload)
    .eq('id', userId)
  if (error) throw new Error(error.message)
  return { ok: true }
}
