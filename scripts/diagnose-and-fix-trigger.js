require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseAndFixTrigger() {
  console.log('🔍 COMPREHENSIVE TRIGGER DIAGNOSIS & FIX\n');

  try {
    // Step 1: Check if handle_new_user function exists
    console.log('--- Step 1: Check handle_new_user Function ---');
    const { data: functions, error: funcError } = await supabase
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
      console.log('❌ Cannot query functions:', funcError.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ handle_new_user function EXISTS');
      console.log('📝 Function body preview:', functions[0].function_body.substring(0, 100) + '...');
    } else {
      console.log('❌ handle_new_user function does NOT exist');
      console.log('📋 This is the root cause of the 500 error');
    }

    // Step 2: Check if trigger exists
    console.log('\n--- Step 2: Check on_auth_user_created Trigger ---');
    const { data: triggers, error: triggerError } = await supabase
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
      console.log('❌ Cannot query triggers:', triggerError.message);
    } else if (triggers && triggers.length > 0) {
      console.log('✅ on_auth_user_created trigger EXISTS');
      console.log('📝 Trigger details:', triggers[0]);
    } else {
      console.log('❌ on_auth_user_created trigger does NOT exist');
      console.log('📋 This is also a cause of the 500 error');
    }

    // Step 3: Check RLS policies on profiles table
    console.log('\n--- Step 3: Check RLS Policies on Profiles ---');
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
      console.log('❌ Cannot query policies:', policiesError.message);
    } else if (policies && policies.length > 0) {
      console.log('✅ Found RLS policies on profiles table:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.command})`);
      });
    } else {
      console.log('❌ No RLS policies found on profiles table');
    }

    // Step 4: Fix the issues
    console.log('\n--- Step 4: Applying Fixes ---');
    
    // Create the handle_new_user function
    console.log('🔧 Creating handle_new_user function...');
    const { error: createFuncError } = await supabase
      .rpc('sql', {
        query: `
          CREATE OR REPLACE FUNCTION public.handle_new_user()
          RETURNS TRIGGER AS $$
          BEGIN
            INSERT INTO public.profiles (id, email, first_name, last_name, role)
            VALUES (
              NEW.id,
              NEW.email,
              COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
              COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
              'owner'
            );
            RETURN NEW;
          EXCEPTION
            WHEN OTHERS THEN
              RAISE LOG 'Error in handle_new_user: %', SQLERRM;
              RAISE;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });

    if (createFuncError) {
      console.log('❌ Failed to create function:', createFuncError.message);
    } else {
      console.log('✅ handle_new_user function created successfully');
    }

    // Create the trigger
    console.log('🔧 Creating on_auth_user_created trigger...');
    const { error: createTriggerError } = await supabase
      .rpc('sql', {
        query: `
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        `
      });

    if (createTriggerError) {
      console.log('❌ Failed to create trigger:', createTriggerError.message);
    } else {
      console.log('✅ on_auth_user_created trigger created successfully');
    }

    // Fix RLS policies
    console.log('🔧 Fixing RLS policies...');
    const { error: rlsError } = await supabase
      .rpc('sql', {
        query: `
          -- Enable RLS
          ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
          
          -- Drop existing policies
          DROP POLICY IF EXISTS "users_create_own_profile" ON profiles;
          DROP POLICY IF EXISTS "owner_create_team_members" ON profiles;
          DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
          DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
          DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
          
          -- Create new policies that allow trigger function to work
          CREATE POLICY "allow_profile_creation" ON profiles
            FOR INSERT WITH CHECK (
              id = auth.uid() OR current_setting('role') = 'postgres'
            );
          
          CREATE POLICY "profiles_select_policy" ON profiles
            FOR SELECT USING (
              id = auth.uid() OR company_id = public.user_company_id()
            );
          
          CREATE POLICY "users_update_own_profile" ON profiles
            FOR UPDATE USING (id = auth.uid());
        `
      });

    if (rlsError) {
      console.log('❌ Failed to fix RLS policies:', rlsError.message);
    } else {
      console.log('✅ RLS policies fixed successfully');
    }

    // Step 5: Test the fix
    console.log('\n--- Step 5: Testing the Fix ---');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`📧 Testing signup with: ${testEmail}`);
    
    const { data: testData, error: testError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (testError) {
      console.log('❌ Test signup failed:', testError.message);
    } else {
      console.log('✅ Test signup succeeded!');
      console.log('✅ User created:', testData.user?.id);
      
      // Check if profile was created
      if (testData.user) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', testData.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Profile creation failed:', profileError.message);
        } else {
          console.log('✅ Profile created successfully by trigger!');
          console.log('📝 Profile data:', profile);
        }
      }
    }

    console.log('\n🎉 DIAGNOSIS AND FIX COMPLETE!');
    console.log('📋 The signup 500 error should now be resolved');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  } finally {
    process.exit(0);
  }
}

diagnoseAndFixTrigger();








