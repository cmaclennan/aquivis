require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Test 1: Check environment variables
console.log('🔍 DIAGNOSING AUTH 500 ERROR - SYSTEMATIC APPROACH\n');

console.log('--- Test 1: Environment Variables ---');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ CRITICAL: Missing required environment variables');
  process.exit(1);
}

// Test 2: Check Supabase connection
console.log('\n--- Test 2: Supabase Connection ---');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('❌ Error details:', error);
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (err) {
    console.log('❌ Connection exception:', err.message);
  }
}

// Test 3: Check Auth configuration
console.log('\n--- Test 3: Auth Configuration ---');
async function testAuthConfig() {
  try {
    // Try to get auth session (should work even if not logged in)
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('❌ Auth session check failed:', sessionError.message);
    } else {
      console.log('✅ Auth service is accessible');
      console.log('📝 Current session:', session.session ? 'Active' : 'None');
    }
  } catch (err) {
    console.log('❌ Auth config exception:', err.message);
  }
}

// Test 4: Try signup with detailed error logging
console.log('\n--- Test 4: Detailed Signup Test ---');
async function testSignupDetailed() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  console.log(`📧 Testing signup with: ${testEmail}`);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (error) {
      console.log('❌ SIGNUP FAILED');
      console.log('❌ Error message:', error.message);
      console.log('❌ Error status:', error.status);
      console.log('❌ Error code:', error.code);
      console.log('❌ Full error object:', JSON.stringify(error, null, 2));
      
      // Check for specific error types
      if (error.status === 500) {
        console.log('\n🚨 500 ERROR ANALYSIS:');
        console.log('- This is a server-side error from Supabase Auth');
        console.log('- Could be: Rate limiting, quota exceeded, or server issue');
        console.log('- Could be: Database trigger/function error');
        console.log('- Could be: RLS policy blocking the operation');
      }
    } else {
      console.log('✅ SIGNUP SUCCESS!');
      console.log('✅ User created:', data.user?.id);
      console.log('✅ Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    }
  } catch (err) {
    console.log('❌ SIGNUP EXCEPTION:', err.message);
    console.log('❌ Exception details:', err);
  }
}

// Test 5: Check database trigger function
console.log('\n--- Test 5: Database Trigger Function ---');
async function testTriggerFunction() {
  if (!supabaseServiceKey) {
    console.log('⚠️  Cannot test trigger function - no service key');
    return;
  }
  
  const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Check if handle_new_user function exists
    const { data: functions, error: funcError } = await serviceSupabase
      .rpc('sql', {
        query: `
          SELECT 
            proname as function_name,
            prosrc as function_body
          FROM pg_proc 
          WHERE proname = 'handle_new_user'
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        `
      });
    
    if (funcError) {
      console.log('❌ Cannot check function:', funcError.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ handle_new_user function exists');
    } else {
      console.log('❌ handle_new_user function does NOT exist');
    }
  } catch (err) {
    console.log('❌ Function check exception:', err.message);
  }
}

// Run all tests
async function runAllTests() {
  await testConnection();
  await testAuthConfig();
  await testSignupDetailed();
  await testTriggerFunction();
  
  console.log('\n🎯 DIAGNOSIS COMPLETE');
  console.log('📋 Review the results above to identify the root cause');
}

runAllTests().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});








