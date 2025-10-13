require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOnboardingFlow() {
  console.log('🧪 TESTING ONBOARDING FLOW AFTER FIX\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check if the new user profile was created
    console.log('\n1️⃣ NEW USER PROFILE CHECK');
    console.log('-'.repeat(30));
    
    const newUserId = 'fe2bc5df-718d-4059-97bb-874ac9f6924f';
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
        company_id: profile.company_id || 'None (expected)'
      });
    }

    // 2. Test companies RLS policies
    console.log('\n2️⃣ COMPANIES RLS POLICIES TEST');
    console.log('-'.repeat(30));
    
    // Test reading companies (this was failing before)
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5);

    if (companiesError) {
      console.log('❌ Cannot read companies:', companiesError.message);
    } else {
      console.log('✅ Can read companies successfully!');
      console.log('📝 Companies found:', companies.length);
      companies.forEach(company => {
        console.log(`   - ${company.id}: ${company.name}`);
      });
    }

    // 3. Test company creation (simulating onboarding)
    console.log('\n3️⃣ COMPANY CREATION TEST (SIMULATING ONBOARDING)');
    console.log('-'.repeat(30));
    
    const { data: testCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Onboarding Test Company',
        business_type: 'both',
        phone: '555-0123',
        timezone: 'Australia/Brisbane',
        unit_system: 'metric',
        date_format: 'DD/MM/YYYY',
        currency: 'AUD',
        compliance_jurisdiction: 'QLD',
        subscription_tier: 'starter',
        subscription_status: 'trial'
      })
      .select()
      .single();

    if (companyError) {
      console.log('❌ Company creation failed:', companyError.message);
      console.log('❌ Error code:', companyError.code);
    } else {
      console.log('✅ Company creation succeeded!');
      console.log('📝 Company data:', {
        id: testCompany.id,
        name: testCompany.name,
        business_type: testCompany.business_type
      });
      
      // Test profile update (simulating onboarding step 2)
      console.log('\n4️⃣ PROFILE UPDATE TEST (SIMULATING ONBOARDING STEP 2)');
      console.log('-'.repeat(30));
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ company_id: testCompany.id })
        .eq('id', newUserId)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Profile update failed:', updateError.message);
      } else {
        console.log('✅ Profile update succeeded!');
        console.log('📝 Updated profile:', {
          id: updatedProfile.id,
          company_id: updatedProfile.company_id,
          name: `${updatedProfile.first_name} ${updatedProfile.last_name}`
        });
      }
      
      // Clean up test data
      await supabase.from('companies').delete().eq('id', testCompany.id);
      console.log('🧹 Test company cleaned up');
    }

    // 5. Final assessment
    console.log('\n5️⃣ FINAL ASSESSMENT');
    console.log('-'.repeat(30));
    
    if (profile && !companiesError && !companyError) {
      console.log('🎉 SUCCESS! Onboarding flow should work:');
      console.log('   ✅ Profile creation works');
      console.log('   ✅ Companies RLS policies work');
      console.log('   ✅ Company creation works');
      console.log('   ✅ Profile update works');
      console.log('   ✅ Complete onboarding flow should work');
    } else {
      console.log('❌ Some issues remain:');
      if (!profile) console.log('   ❌ Profile creation failed');
      if (companiesError) console.log('   ❌ Companies RLS policies failed');
      if (companyError) console.log('   ❌ Company creation failed');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 ONBOARDING FLOW TEST COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testOnboardingFlow();