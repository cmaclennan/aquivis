/**
 * RLS Diagnostic Script
 * Simple Node.js script to check RLS policies
 * Run: node scripts/diagnose-rls.js
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://krxabrdizqbpitpsvgiv.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function diagnose() {
  console.log('🔍 RLS Policy Diagnostic\n')

  // Query actual PostgreSQL policy table
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        polname as policy_name,
        CASE polcmd 
          WHEN 'r' THEN 'SELECT'
          WHEN 'a' THEN 'INSERT'
          WHEN 'w' THEN 'UPDATE'
          WHEN 'd' THEN 'DELETE'
          WHEN '*' THEN 'ALL'
        END as command,
        pg_get_expr(polqual, polrelid) as using_expression,
        pg_get_expr(polwithcheck, polrelid) as with_check_expression
      FROM pg_policy p
      JOIN pg_class c ON p.polrelid = c.oid
      WHERE c.relname = 'companies'
      ORDER BY polname;
    `
  })

  if (error) {
    console.log('Need to create exec_sql function first. Running direct query...')
    
    // Try different approach
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'companies')
    
    console.log('Companies Policies:', JSON.stringify(policies, null, 2))
  } else {
    console.log('Companies Policies:', JSON.stringify(data, null, 2))
  }
}

diagnose().catch(console.error)

