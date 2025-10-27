import { createAdminClient } from '@/lib/supabase/admin'

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

const templatesCache: Map<string, { data: any[]; at: number }> = new Map()
const TEMPLATES_TTL_MS = 30_000

export async function listTemplatesForCompany(companyId: string, supabase?: Supa) {
  const now = Date.now()
  const cached = templatesCache.get(companyId)
  if (cached && now - cached.at < TEMPLATES_TTL_MS) return cached.data

  const db = getAdmin(supabase)
  const { data, error } = await db
    .from('schedule_templates' as any)
    .select('id, template_name, template_type, template_config, is_active, created_at, applicable_unit_types, applicable_water_types, description')
    .eq('company_id', companyId)
    .order('template_name')
  if (error) throw new Error(error.message)
  const result = data || []
  templatesCache.set(companyId, { data: result, at: now })
  return result
}

export async function createTemplateForCompany(companyId: string, payload: any, supabase?: Supa) {
  const db = getAdmin(supabase)
  const insert = {
    company_id: companyId,
    template_name: payload.template_name,
    template_type: payload.template_type,
    template_config: payload.template_config,
    applicable_unit_types: payload.applicable_unit_types ?? null,
    applicable_water_types: payload.applicable_water_types ?? null,
    description: payload.description ?? null,
    is_active: payload.is_active ?? true,
    is_public: false,
  }
  const { data, error } = await db
    .from('schedule_templates' as any)
    .insert(insert as any)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  templatesCache.delete(companyId)
  return data
}

async function ensureTemplateOwned(id: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data } = await db
    .from('schedule_templates' as any)
    .select('id, company_id')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()
  return !!data
}

export async function updateTemplateForCompany(id: string, updates: any, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureTemplateOwned(id, companyId, db)
  if (!owned) throw new Error('Not found')
  const payload: any = {}
  if (updates.template_name !== undefined) payload.template_name = updates.template_name
  if (updates.template_type !== undefined) payload.template_type = updates.template_type
  if (updates.template_config !== undefined) payload.template_config = updates.template_config
  if (updates.applicable_unit_types !== undefined) payload.applicable_unit_types = updates.applicable_unit_types
  if (updates.applicable_water_types !== undefined) payload.applicable_water_types = updates.applicable_water_types
  if (updates.description !== undefined) payload.description = updates.description
  if (updates.is_active !== undefined) payload.is_active = !!updates.is_active
  const { error } = await db
    .from('schedule_templates' as any)
    .update(payload)
    .eq('id', id)
  if (error) throw new Error(error.message)
  templatesCache.delete(companyId)
  return { ok: true }
}

export async function deleteTemplateForCompany(id: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureTemplateOwned(id, companyId, db)
  if (!owned) throw new Error('Not found')
  const { error } = await db
    .from('schedule_templates' as any)
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  templatesCache.delete(companyId)
  return { ok: true }
}
