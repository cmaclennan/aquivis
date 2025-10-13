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

async function diagnoseSignup500() {
  console.log('🔍 Diagnosing 500 signup error in remote Supabase database...\n');

  try {
    // Test 1: Check if handle_new_user function exists
    console.log('--- Test 1: Check handle_new_user function ---');
    const { data: functionCheck, error: functionError } = await supabase
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

    if (functionError) {
      console.log('❌ Cannot check function directly, trying alternative method...');
      
      // Alternative: Try to call the function (will fail if it doesn't exist)
      const { data: testCall, error: callError } = await supabase
        .rpc('handle_new_user');
      
      if (callError && callError.message.includes('function') && callError.message.includes('does not exist')) {
        console.log('❌ handle_new_user function does NOT exist in remote database');
        console.log('📋 Solution: Apply HOTFIX_AUTO_CREATE_PROFILE.sql to remote database');
      } else {
        console.log('✅ handle_new_user function exists (or different error):', callError?.message || 'No error');
      }
    } else {
      if (functionCheck && functionCheck.length > 0) {
        console.log('✅ handle_new_user function exists in remote database');
        console.log('📝 Function body preview:', functionCheck[0].function_body.substring(0, 100) + '...');
      } else {
        console.log('❌ handle_new_user function does NOT exist in remote database');
        console.log('📋 Solution: Apply HOTFIX_AUTO_CREATE_PROFILE.sql to remote database');
      }
    }

    // Test 2: Check if trigger exists
    console.log('\n--- Test 2: Check on_auth_user_created trigger ---');
    const { data: triggerCheck, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_statement
          FROM information_schema.triggers 
          WHERE trigger_name = 'on_auth_user_created'
          AND event_object_table = 'users'
          AND event_object_schema = 'auth';
        `
      });

    if (triggerError) {
      console.log('❌ Cannot check trigger directly:', triggerError.message);
    } else {
      if (triggerCheck && triggerCheck.length > 0) {
        console.log('✅ on_auth_user_created trigger exists');
        console.log('📝 Trigger details:', triggerCheck[0]);
      } else {
        console.log('❌ on_auth_user_created trigger does NOT exist');
        console.log('📋 Solution: Apply HOTFIX_AUTO_CREATE_PROFILE.sql to remote database');
      }
    }

    // Test 3: Check user_role ENUM values
    console.log('\n--- Test 3: Check user_role ENUM values ---');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('role')
      .limit(20);
    
    if (profilesError) {
      console.log('❌ Error querying profiles:', profilesError.message);
    } else {
      const uniqueRoles = [...new Set(profiles.map(p => p.role))];
      console.log(`✅ Current roles in profiles table: ${uniqueRoles.join(', ')}`);
      
      if (uniqueRoles.includes('super_admin')) {
        console.log('✅ super_admin role exists - super admin migration was applied');
      } else {
        console.log('❌ super_admin role does NOT exist - super admin migration may not be complete');
      }
    }

    // Test 4: Check profiles table RLS policies
    console.log('\n--- Test 4: Check profiles table RLS policies ---');
    const { data: policies, error: policiesError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            policyname,
            cmd as command,
            qual as using_clause
          FROM pg_policies 
          WHERE tablename = 'profiles'
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.log('❌ Cannot check RLS policies:', policiesError.message);
    } else {
      if (policies && policies.length > 0) {
        console.log('✅ Found RLS policies on profiles table:');
        policies.forEach(policy => {
          console.log(`  - ${policy.policyname} (${policy.command})`);
        });
      } else {
        console.log('❌ No RLS policies found on profiles table');
        console.log('📋 Solution: Apply HOTFIX_RLS_PROFILES_COMPLETE.sql to remote database');
      }
    }

    // Test 5: Try to create a test user to see the actual error
    console.log('\n--- Test 5: Test user creation (this will show the actual error) ---');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`📧 Creating test user: ${testEmail}`);
    
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
      console.log('❌ Error code:', signupError.status);
      console.log('❌ Full error object:', JSON.stringify(signupError, null, 2));
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
          console.log('❌ Profile error details:', JSON.stringify(profileError, null, 2));
        } else {
          console.log('✅ Profile created successfully:', profile);
        }
      }
    }

    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('📋 Next steps will be provided based on the results above.');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error('❌ Full error:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseSignup500();








