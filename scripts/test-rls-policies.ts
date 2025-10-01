/**
 * RLS Policy Testing Script
 * 
 * Tests RLS policies to verify signup/onboarding flow works
 * Run with: npx tsx scripts/test-rls-policies.ts
 */

import { createClient } from '@supabase/supabase-js'

// Service role client (bypasses RLS)
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA'

const supabaseAdmin = createClient(
  'https://krxabrdizqbpitpsvgiv.supabase.co',
  SERVICE_ROLE_KEY
)

async function testRLSPolicies() {
  console.log('🔍 Testing RLS Policies...\n')

  try {
    // 1. Check current policies on companies table
    console.log('1. Checking companies table policies:')
    const { data: companiesPolicies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'companies')
    
    console.log('Companies policies:', companiesPolicies)
    console.log('')

    // 2. Check current policies on profiles table
    console.log('2. Checking profiles table policies:')
    const { data: profilesPolicies } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles')
    
    console.log('Profiles policies:', profilesPolicies)
    console.log('')

    // 3. Test profile creation trigger
    console.log('3. Checking if auto-create profile trigger exists:')
    const { data: triggers } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        SELECT trigger_name, event_object_table, action_statement
        FROM information_schema.triggers
        WHERE trigger_name = 'on_auth_user_created'
      `
    })
    console.log('Trigger:', triggers)
    console.log('')

    // 4. List existing users
    console.log('4. Listing auth users:')
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    console.log(`Found ${users?.length || 0} users`)
    users?.forEach(u => console.log(`  - ${u.email} (id: ${u.id.substring(0, 8)}...)`))
    console.log('')

    // 5. List existing profiles
    console.log('5. Listing profiles:')
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
    console.log(`Found ${profiles?.length || 0} profiles`)
    profiles?.forEach(p => console.log(`  - ${p.email} (company_id: ${p.company_id || 'NULL'})`))
    console.log('')

    // 6. List existing companies
    console.log('6. Listing companies:')
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('*')
    console.log(`Found ${companies?.length || 0} companies`)
    companies?.forEach(c => console.log(`  - ${c.name}`))
    console.log('')

    console.log('✅ Diagnostic complete!')

  } catch (error) {
    console.error('❌ Error running diagnostics:', error)
  }
}

testRLSPolicies()

