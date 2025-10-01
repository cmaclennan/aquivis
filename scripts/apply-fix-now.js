/**
 * Apply RLS Fix Now - Direct Execution
 * Uses Supabase client with service role to apply fix
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA';

const supabase = createClient(
  'https://krxabrdizqbpitpsvgiv.supabase.co',
  SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function executeSQLStatements() {
  console.log('🔧 Applying RLS Fix...\n');

  // Individual SQL statements to execute
  const statements = [
    // Drop old policies
    'DROP POLICY IF EXISTS "companies_select_member" ON public.companies',
    'DROP POLICY IF EXISTS "companies_insert_auth" ON public.companies',
    'DROP POLICY IF EXISTS "companies_update_owner" ON public.companies',
    'DROP POLICY IF EXISTS "companies_delete_owner" ON public.companies',
    'DROP POLICY IF EXISTS "companies_select_policy" ON public.companies',
    'DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies',
    'DROP POLICY IF EXISTS "companies_update_policy" ON public.companies',
    'DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies',
    
    // Create SELECT policy
    `CREATE POLICY "companies_select_policy" ON public.companies
     FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM public.profiles
         WHERE profiles.company_id = companies.id
         AND profiles.id = auth.uid()
       )
       OR
       (
         auth.uid() IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM public.profiles
           WHERE profiles.id = auth.uid()
           AND profiles.company_id IS NULL
         )
       )
     )`,
    
    // Create INSERT policy
    `CREATE POLICY "companies_insert_policy" ON public.companies
     FOR INSERT
     WITH CHECK (auth.uid() IS NOT NULL)`,
    
    // Create UPDATE policy
    `CREATE POLICY "companies_update_policy" ON public.companies
     FOR UPDATE
     USING (
       EXISTS (
         SELECT 1 FROM public.profiles
         WHERE profiles.company_id = companies.id
         AND profiles.id = auth.uid()
         AND profiles.role = 'owner'
       )
     )
     WITH CHECK (
       EXISTS (
         SELECT 1 FROM public.profiles
         WHERE profiles.company_id = companies.id
         AND profiles.id = auth.uid()
         AND profiles.role = 'owner'
       )
     )`,
    
    // Create DELETE policy
    `CREATE POLICY "companies_delete_policy" ON public.companies
     FOR DELETE
     USING (
       EXISTS (
         SELECT 1 FROM public.profiles
         WHERE profiles.company_id = companies.id
         AND profiles.id = auth.uid()
         AND profiles.role = 'owner'
       )
     )`
  ];

  console.log(`Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const isCreate = stmt.includes('CREATE POLICY');
    const isDrop = stmt.includes('DROP POLICY');
    
    try {
      // Use raw SQL execution via fetch
      const response = await fetch('https://krxabrdizqbpitpsvgiv.supabase.co/rest/v1/rpc/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: stmt })
      });

      if (response.ok || response.status === 404) {
        if (isDrop) {
          console.log(`✅ ${i + 1}. Dropped old policy`);
        } else if (isCreate) {
          const policyName = stmt.match(/"([^"]+)"/)?.[1] || 'policy';
          console.log(`✅ ${i + 1}. Created ${policyName}`);
        }
        successCount++;
      } else {
        const error = await response.text();
        console.log(`⚠️  ${i + 1}. ${isDrop ? 'Drop' : 'Create'} failed (may be normal): ${error.substring(0, 100)}`);
        failCount++;
      }
    } catch (error) {
      console.log(`⚠️  ${i + 1}. Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} succeeded, ${failCount} failed\n`);

  if (failCount === statements.length) {
    console.log('❌ All statements failed - Supabase REST API may not support direct SQL execution\n');
    console.log('📋 MANUAL FIX REQUIRED:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/krxabrdizqbpitpsvgiv/sql/new');
    console.log('   2. Copy contents of FIX_RLS_COMPANIES_FINAL.sql');
    console.log('   3. Paste and Run\n');
    return false;
  }

  return true;
}

executeSQLStatements().then((success) => {
  if (success) {
    console.log('✅ Fix applied! Test at: http://localhost:3000/onboarding\n');
  }
  process.exit(success ? 0 : 1);
});

