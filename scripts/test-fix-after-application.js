require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFixAfterApplication() {
  console.log('🔍 TESTING FIX AFTER APPLICATION\n');

  try {
    // Test 1: Try signup with detailed error logging
    console.log('--- Test 1: Detailed Signup Test ---');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`📧 Testing signup with: ${testEmail}`);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup still failing:', signupError.message);
      console.log('❌ Error code:', signupError.code);
      console.log('❌ Error status:', signupError.status);
      console.log('❌ Full error:', JSON.stringify(signupError, null, 2));
    } else {
      console.log('✅ Signup succeeded!');
      console.log('✅ User created:', signupData.user?.id);
      
      // Check if profile was created
      if (signupData.user) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Profile creation failed:', profileError.message);
        } else {
          console.log('✅ Profile created successfully by trigger!');
          console.log('📝 Profile data:', profile);
        }
      }
    }

    // Test 2: Check if we can manually create a profile (test RLS)
    console.log('\n--- Test 2: Manual Profile Creation Test ---');
    const testUuid = '22222222-2222-2222-2222-222222222222';
    
    try {
      const { data: manualProfile, error: manualError } = await supabase
        .from('profiles')
        .insert({
          id: testUuid,
          email: 'manual-test@example.com',
          first_name: 'Manual',
          last_name: 'Test',
          role: 'owner'
        })
        .select()
        .single();
      
      if (manualError) {
        console.log('❌ Manual profile creation failed:', manualError.message);
        if (manualError.message.includes('row-level security')) {
          console.log('🚨 RLS is still blocking manual inserts');
        } else if (manualError.message.includes('foreign key')) {
          console.log('🚨 Foreign key constraint issue (expected with fake UUID)');
        }
      } else {
        console.log('✅ Manual profile creation succeeded');
        console.log('📝 This means RLS allows inserts with service role key');
        
        // Clean up
        await supabase.from('profiles').delete().eq('id', testUuid);
        console.log('🧹 Test record cleaned up');
      }
    } catch (err) {
      console.log('❌ Manual insert test failed:', err.message);
    }

    // Test 3: Check if trigger function exists (using service key)
    console.log('\n--- Test 3: Check Trigger Function ---');
    try {
      // Try to call the function directly to see if it exists
      const { data: funcTest, error: funcError } = await supabase
        .rpc('handle_new_user');
      
      if (funcError) {
        if (funcError.message.includes('function') && funcError.message.includes('does not exist')) {
          console.log('❌ handle_new_user function does NOT exist');
        } else {
          console.log('❌ Function exists but has error:', funcError.message);
        }
      } else {
        console.log('✅ handle_new_user function exists and is callable');
      }
    } catch (err) {
      console.log('❌ Function test failed:', err.message);
    }

    console.log('\n🎯 TEST RESULTS:');
    console.log('📋 Based on these tests, we can determine:');
    console.log('   1. Whether the signup is still failing');
    console.log('   2. Whether the trigger function exists');
    console.log('   3. Whether RLS policies are working correctly');
    console.log('   4. What the next step should be');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testFixAfterApplication();








