/**
 * Test Complete Onboarding Flow
 * Simulates what the app does during onboarding
 */

const { createClient } = require('@supabase/supabase-js');

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyODM1MTIsImV4cCI6MjA3NDg1OTUxMn0.Og1vlRLR4dEMRvYF4POSifY-oxuCEIqifBlWh4q5Kng';

const supabase = createClient(
  'https://krxabrdizqbpitpsvgiv.supabase.co',
  ANON_KEY
);

async function testFlow() {
  console.log('🧪 Testing Onboarding Flow (As Regular User)\n');

  // Step 1: Login as existing user
  console.log('1️⃣ Logging in as craig.maclennan@gmail.com...');
  const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'craig.maclennan@gmail.com',
    password: 'test123456' // Replace with actual password if different
  });

  if (loginError) {
    console.log('❌ Login failed:', loginError.message);
    console.log('   (This is expected if password is different - test manually instead)\n');
    console.log('📋 Manual Test:');
    console.log('   1. Go to: http://localhost:3000/login');
    console.log('   2. Login with your account');
    console.log('   3. Go to: http://localhost:3000/onboarding');
    console.log('   4. Should see company creation form (no 403 error!)');
    console.log('   5. Create a test company\n');
    return;
  }

  console.log('✅ Logged in!\n');

  // Step 2: Check existing companies (what onboarding page does)
  console.log('2️⃣ Checking existing companies (SELECT)...');
  const { data: companies, error: selectError } = await supabase
    .from('companies')
    .select('*');

  if (selectError) {
    console.log('❌ SELECT failed:', selectError.message);
    console.log('   Status:', selectError.code);
    return;
  }

  console.log('✅ SELECT succeeded!');
  console.log(`   Found ${companies.length} companies`);
  if (companies.length > 0) {
    console.log('   User already has a company - onboarding would skip\n');
    return;
  }
  console.log('   No companies - ready to create one!\n');

  // Step 3: Create company (what happens when user submits form)
  console.log('3️⃣ Creating test company (INSERT)...');
  const { data: newCompany, error: insertError } = await supabase
    .from('companies')
    .insert({
      name: 'Test Pool Services',
      business_type: 'both',
      timezone: 'Australia/Brisbane',
      unit_system: 'metric',
      compliance_jurisdiction: 'QLD'
    })
    .select()
    .single();

  if (insertError) {
    console.log('❌ INSERT failed:', insertError.message);
    console.log('   Status:', insertError.code);
    return;
  }

  console.log('✅ INSERT succeeded!');
  console.log(`   Created company: ${newCompany.name}`);
  console.log(`   Company ID: ${newCompany.id}\n`);

  // Step 4: Update profile with company_id
  console.log('4️⃣ Linking profile to company...');
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ company_id: newCompany.id, role: 'owner' })
    .eq('id', authData.user.id);

  if (updateError) {
    console.log('❌ Profile update failed:', updateError.message);
    return;
  }

  console.log('✅ Profile linked!\n');

  console.log('🎉 COMPLETE FLOW SUCCESSFUL!');
  console.log('\n✅ All tests passed - onboarding flow works!\n');
}

testFlow().catch(console.error);

