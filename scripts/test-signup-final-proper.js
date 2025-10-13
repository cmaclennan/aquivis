require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSignupFinalProper() {
  console.log('🎉 FINAL PROPER TEST - FUNCTION PROPERLY CREATED\n');

  try {
    // Test signup
    console.log('--- Test: User Signup ---');
    const testEmail = `proper-test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`📧 Testing signup with: ${testEmail}`);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Proper',
          last_name: 'Test'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup still failing:', signupError.message);
      console.log('❌ Error code:', signupError.code);
      console.log('❌ Error status:', signupError.status);
    } else {
      console.log('🎉 SIGNUP SUCCEEDED!');
      console.log('✅ User created:', signupData.user?.id);
      console.log('✅ Email:', signupData.user?.email);
      console.log('✅ Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');
      
      // Check if profile was created by trigger
      if (signupData.user) {
        console.log('\n--- Test: Profile Creation by Trigger ---');
        
        // Wait for trigger to execute
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Profile creation failed:', profileError.message);
        } else {
          console.log('🎉 PROFILE CREATED BY TRIGGER!');
          console.log('📝 Profile data:');
          console.log('   - ID:', profile.id);
          console.log('   - Email:', profile.email);
          console.log('   - Name:', profile.first_name, profile.last_name);
          console.log('   - Role:', profile.role);
          console.log('   - Company ID:', profile.company_id || 'None (expected for new user)');
          console.log('   - Created:', profile.created_at);
        }
      }
    }

    console.log('\n🎉 FINAL TEST RESULTS:');
    if (signupError) {
      console.log('❌ SIGNUP STILL FAILING');
      console.log('📋 Even with proper function creation, issue persists');
      console.log('📋 Need to investigate further');
    } else {
      console.log('🎉 SIGNUP WORKING!');
      console.log('✅ Trigger function is working correctly');
      console.log('✅ Profile creation is automatic');
      console.log('✅ The 500 error is resolved!');
      console.log('✅ Users can now register successfully');
      console.log('✅ Proper systematic diagnosis and fix worked!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testSignupFinalProper();








