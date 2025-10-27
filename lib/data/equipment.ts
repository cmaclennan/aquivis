import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyIdForUser } from '@/lib/data/company'

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

export async function isEquipmentOwnedByCompany(equipmentId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data } = await db
    .from('equipment' as any)
    .select('id, properties!inner(company_id)')
    .eq('id', equipmentId)
    .eq('properties.company_id', companyId)
    .single()
  return !!data
}

export async function listMaintenanceLogs(equipmentId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data, error } = await db
    .from('equipment_maintenance_logs' as any)
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('maintenance_date', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createMaintenanceLog(equipmentId: string, payload: any, userId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const insert = {
    equipment_id: equipmentId,
    maintenance_date: payload.maintenance_date,
    maintenance_time: payload.maintenance_time,
    actions: payload.actions,
    notes: payload.notes ?? null,
    performed_by: userId,
  }
  const { data, error } = await db
    .from('equipment_maintenance_logs' as any)
    .insert(insert as any)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function resolveCompanyIdForUser(userId: string, supabase?: Supa) {
  return getCompanyIdForUser(userId, supabase)
}
