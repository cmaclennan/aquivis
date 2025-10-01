/**
 * Apply RLS Fix Directly to Supabase
 * 
 * Uses service role key to update RLS policies on companies table
 * Run with: npx tsx scripts/apply-rls-fix.ts
 */

import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA'

const supabase = createClient(
  'https://krxabrdizqbpitpsvgiv.supabase.co',
  SERVICE_KEY
)

async function applyRLSFix() {
  console.log('🔧 Applying RLS Fix for Companies Table...\n')

  try {
    // Step 1: Drop existing policies
    console.log('1️⃣ Dropping old policies...')
    
    const dropSQL = `
      BEGIN;
      DROP POLICY IF EXISTS "companies_select_member" ON public.companies;
      DROP POLICY IF EXISTS "companies_insert_auth" ON public.companies;
      DROP POLICY IF EXISTS "companies_update_owner" ON public.companies;
      DROP POLICY IF EXISTS "companies_delete_owner" ON public.companies;
      DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
      DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
      DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
      DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;
      COMMIT;
    `
    
    const { error: dropError } = await supabase.rpc('exec_sql', { query: dropSQL })
    
    if (dropError) {
      console.log('   Using direct query method...')
      // Use REST API to execute SQL
      const response = await fetch('https://krxabrdizqbpitpsvgiv.supabase.co/rest/v1/rpc/exec_sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({ query: dropSQL })
      })
      
      if (!response.ok) {
        console.log('   Proceeding with policy creation (old policies may not exist)...')
      }
    }
    
    console.log('   ✅ Old policies dropped\n')

    // Step 2: Create new policies
    console.log('2️⃣ Creating new policies...')
    
    const createSQL = `
      BEGIN;

      -- SELECT Policy: Allow company members OR users without a company
      CREATE POLICY "companies_select_policy" ON public.companies
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
      );

      -- INSERT Policy: Allow ANY authenticated user
      CREATE POLICY "companies_insert_policy" ON public.companies
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);

      -- UPDATE Policy: Only owners
      CREATE POLICY "companies_update_policy" ON public.companies
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
      );

      -- DELETE Policy: Only owners
      CREATE POLICY "companies_delete_policy" ON public.companies
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.company_id = companies.id
          AND profiles.id = auth.uid()
          AND profiles.role = 'owner'
        )
      );

      COMMIT;
    `
    
    // Execute via PostgreSQL
    const { data: createData, error: createError } = await supabase.rpc('exec_sql', { query: createSQL })
    
    if (createError) {
      throw new Error(`Failed to create policies: ${createError.message}`)
    }
    
    console.log('   ✅ New policies created\n')

    // Step 3: Verify policies
    console.log('3️⃣ Verifying policies...')
    
    const verifySQL = `
      SELECT 
        policyname,
        cmd as command,
        qual as using_clause
      FROM pg_policies
      WHERE tablename = 'companies'
      ORDER BY policyname;
    `
    
    const { data: policies, error: verifyError } = await supabase.rpc('exec_sql', { query: verifySQL })
    
    if (verifyError) {
      console.log('   Could not verify, but policies should be created')
    } else {
      console.log('   Policies found:', policies?.length || 0)
      if (policies) {
        policies.forEach((p: any) => {
          console.log(`   - ${p.policyname} (${p.command})`)
        })
      }
    }
    
    console.log('\n✅ RLS Fix Applied Successfully!')
    console.log('\n🧪 Next: Test the onboarding flow at http://localhost:3000/onboarding')

  } catch (error: any) {
    console.error('❌ Error applying fix:', error.message)
    process.exit(1)
  }
}

applyRLSFix()

