require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabaseState() {
  console.log('🔍 THOROUGH DATABASE STATE ANALYSIS\n');
  console.log('📋 This analysis will help us understand the current state WITHOUT making changes\n');

  try {
    // Analysis 1: Check if handle_new_user function exists
    console.log('--- Analysis 1: handle_new_user Function ---');
    try {
      const { data: functions, error: funcError } = await supabase
        .rpc('sql', {
          query: `
            SELECT 
              proname as function_name,
              prosrc as function_body,
              proowner,
              pronargs,
              prorettype
            FROM pg_proc 
            WHERE proname = 'handle_new_user'
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
          `
        });

      if (funcError) {
        console.log('❌ Cannot query function:', funcError.message);
      } else if (functions && functions.length > 0) {
        console.log('✅ handle_new_user function EXISTS');
        console.log('📝 Function details:');
        console.log('   - Name:', functions[0].function_name);
        console.log('   - Owner:', functions[0].proowner);
        console.log('   - Arguments:', functions[0].pronargs);
        console.log('   - Return type:', functions[0].prorettype);
        console.log('   - Body length:', functions[0].function_body.length, 'characters');
      } else {
        console.log('❌ handle_new_user function does NOT exist');
      }
    } catch (err) {
      console.log('❌ Function analysis failed:', err.message);
    }

    // Analysis 2: Check if trigger exists
    console.log('\n--- Analysis 2: on_auth_user_created Trigger ---');
    try {
      const { data: triggers, error: triggerError } = await supabase
        .rpc('sql', {
          query: `
            SELECT 
              trigger_name,
              event_manipulation,
              action_timing,
              action_statement,
              action_orientation
            FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
            AND event_object_table = 'users'
            AND event_object_schema = 'auth';
          `
        });

      if (triggerError) {
        console.log('❌ Cannot query trigger:', triggerError.message);
      } else if (triggers && triggers.length > 0) {
        console.log('✅ on_auth_user_created trigger EXISTS');
        console.log('📝 Trigger details:');
        console.log('   - Name:', triggers[0].trigger_name);
        console.log('   - Event:', triggers[0].event_manipulation);
        console.log('   - Timing:', triggers[0].action_timing);
        console.log('   - Orientation:', triggers[0].action_orientation);
      } else {
        console.log('❌ on_auth_user_created trigger does NOT exist');
      }
    } catch (err) {
      console.log('❌ Trigger analysis failed:', err.message);
    }

    // Analysis 3: Check RLS status and policies on profiles table
    console.log('\n--- Analysis 3: Profiles Table RLS Status ---');
    try {
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('sql', {
          query: `
            SELECT 
              relname as table_name,
              relrowsecurity as rls_enabled,
              relforcerowsecurity as rls_forced
            FROM pg_class 
            WHERE relname = 'profiles';
          `
        });

      if (rlsError) {
        console.log('❌ Cannot query RLS status:', rlsError.message);
      } else if (rlsStatus && rlsStatus.length > 0) {
        console.log('✅ RLS status for profiles table:');
        console.log('   - RLS Enabled:', rlsStatus[0].rls_enabled ? 'YES' : 'NO');
        console.log('   - RLS Forced:', rlsStatus[0].rls_forced ? 'YES' : 'NO');
      }
    } catch (err) {
      console.log('❌ RLS status analysis failed:', err.message);
    }

    // Analysis 4: Check existing RLS policies on profiles
    console.log('\n--- Analysis 4: Existing RLS Policies on Profiles ---');
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('sql', {
          query: `
            SELECT 
              policyname,
              cmd as command,
              permissive,
              roles,
              qual as using_clause,
              with_check as with_check_clause
            FROM pg_policies 
            WHERE tablename = 'profiles'
            ORDER BY policyname;
          `
        });

      if (policiesError) {
        console.log('❌ Cannot query policies:', policiesError.message);
      } else if (policies && policies.length > 0) {
        console.log('✅ Found RLS policies on profiles table:');
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname} (${policy.command})`);
          console.log(`     Permissive: ${policy.permissive}`);
          console.log(`     Roles: ${policy.roles}`);
        });
      } else {
        console.log('❌ No RLS policies found on profiles table');
      }
    } catch (err) {
      console.log('❌ Policies analysis failed:', err.message);
    }

    // Analysis 5: Check user_role ENUM values
    console.log('\n--- Analysis 5: user_role ENUM Values ---');
    try {
      const { data: enumValues, error: enumError } = await supabase
        .rpc('sql', {
          query: `
            SELECT 
              enumlabel as value,
              enumsortorder as sort_order
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
            ORDER BY enumsortorder;
          `
        });

      if (enumError) {
        console.log('❌ Cannot query ENUM values:', enumError.message);
      } else if (enumValues && enumValues.length > 0) {
        console.log('✅ user_role ENUM values:');
        enumValues.forEach(enumVal => {
          console.log(`   - ${enumVal.value} (order: ${enumVal.sort_order})`);
        });
      } else {
        console.log('❌ No user_role ENUM values found');
      }
    } catch (err) {
      console.log('❌ ENUM analysis failed:', err.message);
    }

    // Analysis 6: Check existing profiles (if any)
    console.log('\n--- Analysis 6: Existing Profiles ---');
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, company_id, created_at')
        .limit(10);

      if (profilesError) {
        console.log('❌ Cannot query profiles:', profilesError.message);
      } else if (profiles && profiles.length > 0) {
        console.log('✅ Found existing profiles:');
        profiles.forEach(profile => {
          console.log(`   - ${profile.email} (${profile.role}) - Company: ${profile.company_id || 'None'}`);
        });
      } else {
        console.log('✅ No existing profiles found (empty table)');
      }
    } catch (err) {
      console.log('❌ Profiles analysis failed:', err.message);
    }

    // Analysis 7: Check if we can manually insert into profiles (test RLS)
    console.log('\n--- Analysis 7: Test Manual Profile Insert (RLS Test) ---');
    try {
      const testId = '00000000-0000-0000-0000-000000000000';
      const { data: insertTest, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: testId,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'owner'
        })
        .select()
        .single();

      if (insertError) {
        console.log('❌ Manual insert failed:', insertError.message);
        if (insertError.message.includes('row-level security')) {
          console.log('🚨 RLS is blocking manual inserts');
        }
      } else {
        console.log('✅ Manual insert succeeded');
        console.log('📝 This means RLS allows inserts with service role key');
        
        // Clean up test record
        await supabase.from('profiles').delete().eq('id', testId);
        console.log('🧹 Test record cleaned up');
      }
    } catch (err) {
      console.log('❌ Manual insert test failed:', err.message);
    }

    console.log('\n🎯 ANALYSIS COMPLETE');
    console.log('📋 Based on this analysis, we can now determine:');
    console.log('   1. What components exist vs. what are missing');
    console.log('   2. What the actual root cause of the 500 error is');
    console.log('   3. What specific fix is needed (if any)');
    console.log('   4. Whether any existing functionality would be affected');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    process.exit(0);
  }
}

analyzeDatabaseState();








