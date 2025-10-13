require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTriggerWithAnonKey() {
  console.log('🔍 CHECKING TRIGGER FUNCTION WITH ANON KEY\n');

  // Since we can't directly query system tables with anon key,
  // let's try a different approach: test if we can manually create a profile
  // to see if the issue is with the trigger function or RLS policies

  console.log('--- Test: Manual Profile Creation ---');
  
  // First, let's try to create a user and see if we can manually create the profile
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (authError) {
      console.log('❌ Auth signup failed:', authError.message);
      return;
    }

    if (authData.user) {
      console.log('✅ Auth user created:', authData.user.id);
      
      // Step 2: Wait a moment to see if trigger creates profile
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 3: Check if profile was created by trigger
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Profile not created by trigger:', profileError.message);
        
        // Step 4: Try to manually create the profile
        console.log('\n--- Test: Manual Profile Creation ---');
        const { data: manualProfile, error: manualError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            first_name: 'Test',
            last_name: 'User',
            role: 'owner'
          })
          .select()
          .single();
        
        if (manualError) {
          console.log('❌ Manual profile creation failed:', manualError.message);
          if (manualError.message.includes('row-level security')) {
            console.log('🚨 RLS is blocking manual profile creation');
            console.log('📋 This suggests the trigger function has the same RLS issue');
          }
        } else {
          console.log('✅ Manual profile creation succeeded');
          console.log('📋 This means RLS policies allow profile creation');
          console.log('🚨 The issue is likely with the trigger function itself');
        }
      } else {
        console.log('✅ Profile created by trigger successfully');
        console.log('📋 Trigger function is working correctly');
      }
    }
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
}

checkTriggerWithAnonKey().then(() => process.exit(0));








