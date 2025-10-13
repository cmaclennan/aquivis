require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugProfilesTable() {
  console.log('🔍 DEBUGGING PROFILES TABLE ACCESS\n');

  try {
    // Test 1: Can we read from profiles table?
    console.log('--- Test 1: Read from profiles table ---');
    const { data: profiles, error: readError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.log('❌ Cannot read from profiles:', readError.message);
    } else {
      console.log('✅ Can read from profiles table');
      console.log('📝 Found profiles:', profiles.length);
      if (profiles.length > 0) {
        console.log('📝 Sample profile:', profiles[0]);
      }
    }

    // Test 2: Can we insert into profiles table with a real UUID?
    console.log('\n--- Test 2: Insert into profiles table ---');
    
    // First, let's try to create an auth user to get a real UUID
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
      console.log('📋 This confirms the trigger function issue');
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
          if (manualError.message.includes('row-level security')) {
            console.log('🚨 RLS is blocking manual profile creation');
          } else if (manualError.message.includes('duplicate key')) {
            console.log('✅ Profile already exists (trigger worked!)');
          }
        } else {
          console.log('✅ Manual profile creation succeeded');
          console.log('📝 Profile data:', manualProfile);
        }
      }
    }

    // Test 3: Check if we can update existing profiles
    console.log('\n--- Test 3: Update existing profiles ---');
    if (profiles && profiles.length > 0) {
      const existingProfile = profiles[0];
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingProfile.id)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Cannot update profiles:', updateError.message);
      } else {
        console.log('✅ Can update profiles');
        console.log('📝 Updated profile:', updateData);
      }
    }

    console.log('\n🎯 DEBUG RESULTS:');
    console.log('📋 This helps us understand:');
    console.log('   1. Whether we can access the profiles table');
    console.log('   2. Whether the trigger function is the issue');
    console.log('   3. Whether RLS policies are blocking operations');
    console.log('   4. What the next debugging step should be');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    process.exit(0);
  }
}

debugProfilesTable();








