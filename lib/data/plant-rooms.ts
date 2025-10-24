import { createAdminClient } from '@/lib/supabase/admin'
import { ensurePropertyOwned } from '@/lib/data/property-rules'

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

export async function createPlantRoomForProperty(propertyId: string, companyId: string, payload: any, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensurePropertyOwned(propertyId, companyId, db)
  if (!owned) throw new Error('Not found')

  const insert = {
    property_id: propertyId,
    name: payload.name,
    check_frequency: payload.check_frequency || 'daily',
    check_times: payload.check_times || ['09:00'],
    check_days: payload.check_days || null,
    notes: payload.notes ?? null,
    is_active: payload.is_active ?? true,
  }

  const { data, error } = await db
    .from('plant_rooms' as any)
    .insert(insert as any)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}
