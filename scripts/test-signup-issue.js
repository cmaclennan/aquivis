require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testSignupIssue() {
  console.log('🔍 Testing signup issue...');

  try {
    // Test 1: Check current user_role ENUM values
    console.log('\n--- Test 1: Check user_role ENUM values ---');
    const { data: enumData, error: enumError } = await supabase
      .rpc('get_enum_values', { enum_name: 'user_role' });
    
    if (enumError) {
      console.log('❌ Cannot query ENUM directly, checking profiles table instead...');
      
      // Alternative: Check what roles exist in profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('role')
        .limit(10);
      
      if (profilesError) throw profilesError;
      
      const uniqueRoles = [...new Set(profiles.map(p => p.role))];
      console.log(`✅ Current roles in profiles table: ${uniqueRoles.join(', ')}`);
    } else {
      console.log(`✅ Current user_role ENUM values: ${enumData.join(', ')}`);
    }

    // Test 2: Check if handle_new_user function exists
    console.log('\n--- Test 2: Check handle_new_user function ---');
    const { data: functionData, error: functionError } = await supabase
      .rpc('check_function_exists', { function_name: 'handle_new_user' });
    
    if (functionError) {
      console.log('❌ Cannot check function directly, trying to test trigger...');
    } else {
      console.log(`✅ handle_new_user function exists: ${functionData}`);
    }

    // Test 3: Try to create a test user (this will show us the actual error)
    console.log('\n--- Test 3: Test user creation ---');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
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
      console.log('❌ Signup failed with error:', signupError.message);
      console.log('❌ Error details:', signupError);
    } else {
      console.log('✅ Signup succeeded!');
      console.log('✅ User created:', signupData.user?.id);
      
      // Check if profile was created
      if (signupData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Profile creation failed:', profileError.message);
        } else {
          console.log('✅ Profile created successfully:', profile);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Full error:', error);
  } finally {
    process.exit(0);
  }
}

testSignupIssue();








