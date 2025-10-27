import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyIdForUser } from '@/lib/data/company'

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

export type ServiceFilters = {
  propertyId?: string
  unitId?: string
  startDate?: string
  endDate?: string
  serviceType?: string
  status?: string
  limit?: number
}

export async function listServicesForCompany(companyId: string, filters: ServiceFilters = {}, supabase?: Supa) {
  const db = getAdmin(supabase)
  let query = db
    .from('services' as any)
    .select(`
      id,
      service_date,
      service_type,
      status,
      notes,
      technician:profiles!services_technician_id_fkey(first_name, last_name),
      units(
        id,
        name,
        properties(id, name, address, company_id)
      ),
      water_tests(id, ph, chlorine, bromine, alkalinity, all_parameters_ok, test_time),
      service_chemicals(id, chemical_name, amount)
    `)
    .eq('units.properties.company_id', companyId)
    .order('service_date', { ascending: false })

  if (filters.propertyId) query = query.eq('units.properties.id', filters.propertyId)
  if (filters.unitId) query = query.eq('unit_id', filters.unitId)
  if (filters.startDate) query = query.gte('service_date', filters.startDate)
  if (filters.endDate) query = query.lte('service_date', filters.endDate)
  if (filters.serviceType) query = query.eq('service_type', filters.serviceType)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.limit && filters.limit > 0) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function validateServiceTargetOwnership(companyId: string, payload: any, supabase?: Supa) {
  const db = getAdmin(supabase)
  let ownerOk = false
  if (payload?.property_id) {
    const { data: prop } = await db
      .from('properties' as any)
      .select('id')
      .eq('id', payload.property_id)
      .eq('company_id', companyId)
      .single()
    ownerOk = !!prop
  }
  if (!ownerOk && payload?.unit_id) {
    const { data: unit } = await db
      .from('units' as any)
      .select('id, properties!inner(company_id)')
      .eq('id', payload.unit_id)
      .eq('properties.company_id', companyId)
      .single()
    ownerOk = !!unit
  }
  return ownerOk
}

export async function createServiceForCompany(companyId: string, payload: any, userId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const ownerOk = await validateServiceTargetOwnership(companyId, payload, db)
  if (!ownerOk) throw new Error('Invalid target (property/unit)')

  const { data, error } = await db
    .from('services' as any)
    .insert(payload as any)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function resolveCompanyIdForUser(userId: string, supabase?: Supa) {
  return getCompanyIdForUser(userId, supabase)
}

export async function ensureServiceOwnedByCompany(serviceId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data } = await db
    .from('services' as any)
    .select('id, units!inner(properties!inner(company_id))')
    .eq('id', serviceId)
    .eq('units.properties.company_id', companyId)
    .single()
  return !!data
}

export async function createWaterTestForService(serviceId: string, payload: any, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureServiceOwnedByCompany(serviceId, companyId, db)
  if (!owned) throw new Error('Not found')

  const insert = {
    service_id: serviceId,
    test_time: new Date().toISOString(),
    ...payload,
  }
  const { data, error } = await db
    .from('water_tests' as any)
    .insert(insert as any)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function addChemicalAdditionsForService(serviceId: string, additions: any[], companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureServiceOwnedByCompany(serviceId, companyId, db)
  if (!owned) throw new Error('Not found')
  if (!additions?.length) return 0

  const rows = additions.map((a: any) => ({
    service_id: serviceId,
    chemical_type: a.chemical_type || a.chemicalType,
    quantity: Number(a.quantity || 0),
    unit_of_measure: a.unit_of_measure || a.unitOfMeasure || '',
    cost: a.cost != null ? Number(a.cost) : undefined,
  }))

  const { data, error } = await db
    .from('chemical_additions' as any)
    .insert(rows as any)
    .select('id')
  if (error) throw new Error(error.message)
  return (data || []).length
}

export async function getServiceByIdForCompany(serviceId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data, error } = await db
    .from('services' as any)
    .select(`
      id,
      service_date,
      service_type,
      status,
      notes,
      created_at,
      updated_at,
      unit:units(
        id,
        name,
        unit_type,
        properties(id, name, address, customer_id, company_id)
      ),
      property:properties(id, name),
      water_tests(
        id,
        ph,
        chlorine,
        total_chlorine,
        free_chlorine,
        alkalinity,
        calcium_hardness,
        cyanuric_acid,
        phosphates,
        salt,
        temperature,
        tds,
        notes,
        created_at
      ),
      chemical_additions:chemical_additions(
        id,
        chemical_type,
        quantity,
        unit_of_measure,
        cost
      ),
      maintenance_tasks(
        id,
        task_type,
        completed,
        notes
      ),
      service_photos(
        id,
        photo_url,
        caption,
        created_at
      )
    `)
    .eq('id', serviceId)
    .eq('units.properties.company_id', companyId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateServiceForCompany(serviceId: string, updates: any, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureServiceOwnedByCompany(serviceId, companyId, db)
  if (!owned) throw new Error('Not found')
  const { data, error } = await db
    .from('services' as any)
    .update(updates as any)
    .eq('id', serviceId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteServiceForCompany(serviceId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureServiceOwnedByCompany(serviceId, companyId, db)
  if (!owned) throw new Error('Not found')
  const { error } = await db
    .from('services' as any)
    .delete()
    .eq('id', serviceId)
  if (error) throw new Error(error.message)
  return true
}

export async function addMaintenanceTasksForService(serviceId: string, tasks: any[], companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureServiceOwnedByCompany(serviceId, companyId, db)
  if (!owned) throw new Error('Not found')
  if (!tasks?.length) return 0

  const rows = tasks.map((t: any) => ({
    service_id: serviceId,
    task_type: t.task_type || t.taskType,
    completed: !!t.completed,
    notes: t.notes || null,
  }))

  const { data, error } = await db
    .from('maintenance_tasks' as any)
    .insert(rows as any)
    .select('id')
  if (error) throw new Error(error.message)
  return (data || []).length
}

export async function updateMaintenanceTaskForService(serviceId: string, taskId: string, updates: any, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureServiceOwnedByCompany(serviceId, companyId, db)
  if (!owned) throw new Error('Not found')
  const { data, error } = await db
    .from('maintenance_tasks' as any)
    .update(updates as any)
    .eq('id', taskId)
    .eq('service_id', serviceId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateWaterTestForService(serviceId: string, testId: string, updates: any, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureServiceOwnedByCompany(serviceId, companyId, db)
  if (!owned) throw new Error('Not found')
  const { data, error } = await db
    .from('water_tests' as any)
    .update(updates as any)
    .eq('id', testId)
    .eq('service_id', serviceId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateChemicalAdditionForService(serviceId: string, chemId: string, updates: any, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureServiceOwnedByCompany(serviceId, companyId, db)
  if (!owned) throw new Error('Not found')
  const { data, error } = await db
    .from('chemical_additions' as any)
    .update(updates as any)
    .eq('id', chemId)
    .eq('service_id', serviceId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}
