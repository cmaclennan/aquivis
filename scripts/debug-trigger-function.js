require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTriggerFunction() {
  console.log('🔍 DEBUGGING TRIGGER FUNCTION\n');

  try {
    // Test 1: Check if we can manually create a profile with a real auth user
    console.log('--- Test 1: Manual Profile Creation with Real Auth User ---');
    
    // First, let's try to create an auth user and see if we can manually create the profile
    const testEmail = `debug-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`📧 Creating auth user: ${testEmail}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Debug',
          last_name: 'Test'
        }
      }
    });

    if (authError) {
      console.log('❌ Auth signup failed:', authError.message);
      console.log('📋 This confirms the trigger function is still not working');
    } else {
      console.log('✅ Auth signup succeeded!');
      console.log('✅ User ID:', authData.user?.id);
      
      // Now try to manually create the profile
      if (authData.user) {
        console.log('📝 Attempting to manually create profile...');
        const { data: manualProfile, error: manualError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            first_name: 'Debug',
            last_name: 'Test',
            role: 'owner'
          })
          .select()
          .single();
        
        if (manualError) {
          console.log('❌ Manual profile creation failed:', manualError.message);
          if (manualError.message.includes('duplicate key')) {
            console.log('✅ Profile already exists (trigger worked!)');
            
            // Check the existing profile
            const { data: existingProfile, error: existingError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();
            
            if (existingError) {
              console.log('❌ Cannot read existing profile:', existingError.message);
            } else {
              console.log('✅ Found existing profile:', existingProfile);
            }
          }
        } else {
          console.log('✅ Manual profile creation succeeded');
          console.log('📝 Profile data:', manualProfile);
        }
      }
    }

    // Test 2: Check if there are any other RLS policies that might be blocking
    console.log('\n--- Test 2: Check RLS Policies ---');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual')
      .eq('tablename', 'profiles')
      .limit(10);
    
    if (policiesError) {
      console.log('❌ Cannot query policies:', policiesError.message);
    } else {
      console.log('✅ Found RLS policies on profiles table:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }

    // Test 3: Check if the trigger function has any errors
    console.log('\n--- Test 3: Check Trigger Function ---');
    try {
      // Try to call the function directly (this might fail, but let's see)
      const { data: funcTest, error: funcError } = await supabase
        .rpc('handle_new_user');
      
      if (funcError) {
        console.log('❌ Function call failed:', funcError.message);
      } else {
        console.log('✅ Function is callable');
      }
    } catch (err) {
      console.log('❌ Function test failed:', err.message);
    }

    console.log('\n🎯 DEBUG RESULTS:');
    console.log('📋 This helps us understand:');
    console.log('   1. Whether the trigger function is actually working');
    console.log('   2. Whether there are other RLS policies blocking it');
    console.log('   3. Whether the function has errors');
    console.log('   4. What the next step should be');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    process.exit(0);
  }
}

debugTriggerFunction();








