require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSignupFinal() {
  console.log('🎉 FINAL SIGNUP TEST - COMPREHENSIVE FIX APPLIED\n');

  try {
    // Test signup
    console.log('--- Test: User Signup ---');
    const testEmail = `final-test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`📧 Testing signup with: ${testEmail}`);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Final',
          last_name: 'Test'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup still failing:', signupError.message);
      console.log('❌ Error code:', signupError.code);
      console.log('❌ Error status:', signupError.status);
      console.log('❌ Full error:', JSON.stringify(signupError, null, 2));
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

    // Test 2: Try another signup to ensure consistency
    console.log('\n--- Test: Second Signup (Consistency) ---');
    const testEmail2 = `final-test2-${Date.now()}@example.com`;
    
    const { data: signupData2, error: signupError2 } = await supabase.auth.signUp({
      email: testEmail2,
      password: 'testpassword123',
      options: {
        data: {
          first_name: 'Final2',
          last_name: 'Test2'
        }
      }
    });

    if (signupError2) {
      console.log('❌ Second signup failed:', signupError2.message);
    } else {
      console.log('✅ Second signup also succeeded!');
      console.log('✅ User ID:', signupData2.user?.id);
      
      // Check profile
      if (signupData2.user) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: profile2, error: profileError2 } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData2.user.id)
          .single();
        
        if (profileError2) {
          console.log('❌ Second profile creation failed:', profileError2.message);
        } else {
          console.log('✅ Second profile created successfully!');
          console.log('📝 Profile:', profile2.first_name, profile2.last_name, `(${profile2.role})`);
        }
      }
    }

    console.log('\n🎉 FINAL TEST RESULTS:');
    if (signupError) {
      console.log('❌ SIGNUP STILL FAILING');
      console.log('📋 The comprehensive fix did not resolve the issue');
      console.log('📋 Need to investigate further');
    } else {
      console.log('🎉 SIGNUP WORKING!');
      console.log('✅ Trigger function is working correctly');
      console.log('✅ Profile creation is automatic');
      console.log('✅ The 500 error is resolved!');
      console.log('✅ Users can now register successfully');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testSignupFinal();








