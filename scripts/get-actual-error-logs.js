require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getActualErrorLogs() {
  console.log('🔍 GETTING ACTUAL ERROR LOGS FROM DATABASE\n');

  try {
    // Test 1: Try to create a user and capture the exact error
    console.log('--- Test 1: Create User and Capture Exact Error ---');
    const testEmail = `error-test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`📧 Creating user: ${testEmail}`);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Error',
          last_name: 'Test'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup Error Details:');
      console.log('   - Message:', signupError.message);
      console.log('   - Code:', signupError.code);
      console.log('   - Status:', signupError.status);
      console.log('   - Full Error:', JSON.stringify(signupError, null, 2));
    } else {
      console.log('✅ Signup succeeded!');
      console.log('✅ User ID:', signupData.user?.id);
    }

    // Test 2: Check if we can query the database logs (if available)
    console.log('\n--- Test 2: Check Database Logs ---');
    try {
      const { data: logs, error: logsError } = await supabase
        .from('pg_stat_activity')
        .select('*')
        .limit(5);
      
      if (logsError) {
        console.log('❌ Cannot query activity logs:', logsError.message);
      } else {
        console.log('✅ Found activity logs:', logs.length);
      }
    } catch (err) {
      console.log('❌ Logs query failed:', err.message);
    }

    // Test 3: Check if we can query the actual trigger function
    console.log('\n--- Test 3: Check Trigger Function Directly ---');
    try {
      // Try to call the function with a test parameter
      const { data: funcTest, error: funcError } = await supabase
        .rpc('handle_new_user');
      
      if (funcError) {
        console.log('❌ Function call failed:', funcError.message);
        console.log('❌ Function error details:', JSON.stringify(funcError, null, 2));
      } else {
        console.log('✅ Function is callable');
      }
    } catch (err) {
      console.log('❌ Function test failed:', err.message);
    }

    // Test 4: Check if we can manually create a profile to test the constraints
    console.log('\n--- Test 4: Test Profile Creation Constraints ---');
    
    // First, let's see if we can create a profile with a real UUID
    const testUuid = '12345678-1234-1234-1234-123456789012';
    
    try {
      const { data: testProfile, error: testError } = await supabase
        .from('profiles')
        .insert({
          id: testUuid,
          email: 'test-constraint@example.com',
          first_name: 'Test',
          last_name: 'Constraint',
          role: 'owner'
        })
        .select()
        .single();
      
      if (testError) {
        console.log('❌ Profile creation failed:', testError.message);
        console.log('❌ Constraint error details:', JSON.stringify(testError, null, 2));
      } else {
        console.log('✅ Profile creation succeeded');
        // Clean up
        await supabase.from('profiles').delete().eq('id', testUuid);
        console.log('🧹 Test profile cleaned up');
      }
    } catch (err) {
      console.log('❌ Profile test failed:', err.message);
    }

    console.log('\n🎯 ERROR ANALYSIS COMPLETE');
    console.log('📋 Based on these results, we can determine:');
    console.log('   1. The exact error message from signup');
    console.log('   2. Whether the trigger function is working');
    console.log('   3. What constraints are blocking profile creation');
    console.log('   4. The actual root cause of the 500 error');

  } catch (error) {
    console.error('❌ Error analysis failed:', error.message);
  } finally {
    process.exit(0);
  }
}

getActualErrorLogs();








