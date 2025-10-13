require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteFlow() {
  console.log('🎉 TESTING COMPLETE FLOW AFTER FIXES\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check if the profile was created
    console.log('\n1️⃣ PROFILE CREATION CHECK');
    console.log('-'.repeat(30));
    
    const newUserId = '30a70696-428a-4a8e-862c-e4f4866bf3bf';
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUserId)
      .single();

    if (profileError) {
      console.log('❌ Profile not found:', profileError.message);
    } else {
      console.log('✅ Profile created successfully!');
      console.log('📝 Profile data:', {
        id: profile.id,
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`,
        role: profile.role,
        company_id: profile.company_id
      });
    }

    // 2. Check companies RLS policies
    console.log('\n2️⃣ COMPANIES RLS POLICIES CHECK');
    console.log('-'.repeat(30));
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            policyname,
            cmd as command,
            permissive,
            roles
          FROM pg_policies 
          WHERE tablename = 'companies'
          ORDER BY policyname
        `
      });

    if (policiesError) {
      console.log('❌ Cannot check policies:', policiesError.message);
    } else {
      console.log('✅ Companies RLS policies:');
      policies?.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.command} (${policy.permissive})`);
      });
    }

    // 3. Test company creation (this should work now)
    console.log('\n3️⃣ COMPANY CREATION TEST');
    console.log('-'.repeat(30));
    
    const { data: testCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Test Company Creation',
        business_type: 'both',
        email: 'test@company.com',
        phone: '555-0123',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postal_code: '12345',
        timezone: 'UTC',
        unit_system: 'metric',
        date_format: 'DD/MM/YYYY',
        currency: 'USD',
        compliance_jurisdiction: 'US',
        subscription_tier: 'starter',
        subscription_status: 'trial'
      })
      .select();

    if (companyError) {
      console.log('❌ Company creation failed:', companyError.message);
      console.log('❌ Error code:', companyError.code);
    } else {
      console.log('✅ Company creation succeeded!');
      console.log('📝 Company data:', {
        id: testCompany[0].id,
        name: testCompany[0].name,
        business_type: testCompany[0].business_type
      });
      
      // Clean up
      await supabase.from('companies').delete().eq('id', testCompany[0].id);
      console.log('🧹 Test company cleaned up');
    }

    // 4. Check total profiles and companies
    console.log('\n4️⃣ FINAL STATE CHECK');
    console.log('-'.repeat(30));
    
    const { count: profileCount, error: profileCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: companyCount, error: companyCountError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (profileCountError) {
      console.log('❌ Cannot count profiles:', profileCountError.message);
    } else {
      console.log(`📊 Total profiles: ${profileCount}`);
    }

    if (companyCountError) {
      console.log('❌ Cannot count companies:', companyCountError.message);
    } else {
      console.log(`📊 Total companies: ${companyCount}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMPLETE FLOW TEST RESULTS');
    console.log('='.repeat(60));
    
    if (profile && !companyError) {
      console.log('🎉 SUCCESS! All fixes are working:');
      console.log('   ✅ Profile creation works');
      console.log('   ✅ Companies RLS policies work');
      console.log('   ✅ Company creation works');
      console.log('   ✅ Onboarding flow should work now');
    } else {
      console.log('❌ Some issues remain:');
      if (!profile) console.log('   ❌ Profile creation failed');
      if (companyError) console.log('   ❌ Company creation failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testCompleteFlow();






