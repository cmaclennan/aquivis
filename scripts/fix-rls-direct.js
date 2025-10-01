/**
 * Direct RLS Fix via Supabase Admin API
 * Run: node scripts/fix-rls-direct.js
 */

const https = require('https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA';
const SUPABASE_URL = 'https://krxabrdizqbpitpsvgiv.supabase.co';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'krxabrdizqbpitpsvgiv.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function applyFix() {
  console.log('🔧 Applying RLS Fix Directly...\n');

  // The complete SQL fix
  const fixSQL = `
-- Drop old policies
DROP POLICY IF EXISTS "companies_select_member" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_auth" ON public.companies;
DROP POLICY IF EXISTS "companies_update_owner" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_owner" ON public.companies;
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

-- SELECT Policy
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

-- INSERT Policy
CREATE POLICY "companies_insert_policy" ON public.companies
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE Policy
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

-- DELETE Policy
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
`;

  console.log('📝 SQL prepared, executing via Supabase Admin API...\n');
  console.log('⚠️  Note: If this fails, you\'ll need to run FIX_RLS_COMPANIES_FINAL.sql manually in Supabase SQL Editor\n');

  try {
    const result = await executeSQL(fixSQL);
    console.log('✅ Fix applied successfully!');
    console.log('\n🧪 Test the flow:');
    console.log('   1. Go to http://localhost:3000/onboarding');
    console.log('   2. Create a company');
    console.log('   3. Should work without 403 errors!\n');
  } catch (error) {
    console.error('❌ API execution failed:', error.message);
    console.log('\n📋 FALLBACK: Run this SQL manually in Supabase SQL Editor:');
    console.log('   File: FIX_RLS_COMPANIES_FINAL.sql');
    console.log('   Dashboard: https://supabase.com/dashboard/project/krxabrdizqbpitpsvgiv/sql/new\n');
  }
}

applyFix();

