import { createAdminClient } from '@/lib/supabase/admin'

type Supa = any

function getAdmin(supabase?: Supa): Supa {
  return supabase || (createAdminClient() as any)
}

export async function ensurePropertyOwned(propertyId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data } = await db
    .from('properties' as any)
    .select('id')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .single()
  return !!data
}

export async function listPropertyRules(propertyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data, error } = await db
    .from('property_scheduling_rules' as any)
    .select('id, rule_name, rule_type, rule_config, is_active')
    .eq('property_id', propertyId)
  .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createPropertyRule(propertyId: string, payload: any, supabase?: Supa) {
  const db = getAdmin(supabase)
  const insert = {
    property_id: propertyId,
    rule_name: payload.rule_name || 'Random Selection',
    rule_type: 'random_selection',
    rule_config: payload.rule_config || {},
    is_active: payload.is_active !== false,
  }
  const { data, error } = await db
    .from('property_scheduling_rules' as any)
    .insert(insert as any)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function ensureRuleOwned(ruleId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const { data } = await db
    .from('property_scheduling_rules' as any)
    .select('id, properties!inner(company_id)')
    .eq('id', ruleId)
    .eq('properties.company_id', companyId)
    .single()
  return !!data
}

export async function updatePropertyRuleForCompany(ruleId: string, updates: any, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureRuleOwned(ruleId, companyId, db)
  if (!owned) throw new Error('Not found')
  const payload: any = {}
  if (updates.is_active !== undefined) payload.is_active = !!updates.is_active
  if (updates.rule_name !== undefined) payload.rule_name = updates.rule_name
  if (updates.rule_config !== undefined) payload.rule_config = updates.rule_config
  const { data, error } = await db
    .from('property_scheduling_rules' as any)
    .update(payload)
    .eq('id', ruleId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deletePropertyRuleForCompany(ruleId: string, companyId: string, supabase?: Supa) {
  const db = getAdmin(supabase)
  const owned = await ensureRuleOwned(ruleId, companyId, db)
  if (!owned) throw new Error('Not found')
  const { error } = await db
    .from('property_scheduling_rules' as any)
    .delete()
    .eq('id', ruleId)
  if (error) throw new Error(error.message)
  return { ok: true }
}
