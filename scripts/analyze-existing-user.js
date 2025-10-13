require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeExistingUser() {
  console.log('🔍 ANALYZING EXISTING USER TO UNDERSTAND WHAT WORKED\n');

  try {
    // Get the existing user profile
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('❌ Cannot query profiles:', profilesError.message);
      return;
    }

    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      console.log('✅ Found existing profile:');
      console.log('📝 Profile details:');
      console.log('   - ID:', profile.id);
      console.log('   - Email:', profile.email);
      console.log('   - Role:', profile.role);
      console.log('   - Company ID:', profile.company_id);
      console.log('   - Created:', profile.created_at);
      console.log('   - Updated:', profile.updated_at);

      // Check if this user exists in auth.users
      console.log('\n--- Checking Auth User ---');
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('id', profile.id)
        .limit(1);

      if (authError) {
        console.log('❌ Cannot query auth.users:', authError.message);
        console.log('📋 This is expected - auth.users is not directly accessible');
      } else {
        console.log('✅ Auth user found:', authUsers.length > 0 ? 'YES' : 'NO');
      }

      // Test: Can we create a new profile manually with a real UUID?
      console.log('\n--- Test: Manual Profile Creation with Real UUID ---');
      const testUuid = '11111111-1111-1111-1111-111111111111';
      
      // First, let's try to create an auth user (this might fail, but let's see)
      console.log('📧 Attempting to create auth user first...');
      const { data: authData, error: authSignupError } = await supabase.auth.signUp({
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      });

      if (authSignupError) {
        console.log('❌ Auth signup failed:', authSignupError.message);
        console.log('📋 This confirms the trigger function issue');
      } else {
        console.log('✅ Auth signup succeeded!');
        console.log('✅ User ID:', authData.user?.id);
        
        // Check if profile was created
        if (authData.user) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: newProfile, error: newProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          if (newProfileError) {
            console.log('❌ Profile not created by trigger:', newProfileError.message);
          } else {
            console.log('✅ Profile created by trigger successfully!');
            console.log('📝 New profile:', newProfile);
          }
        }
      }
    } else {
      console.log('❌ No existing profiles found');
    }

    console.log('\n🎯 ANALYSIS COMPLETE');
    console.log('📋 This analysis helps us understand:');
    console.log('   1. Whether the system worked before');
    console.log('   2. What the current state is');
    console.log('   3. Whether the trigger function is the issue');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    process.exit(0);
  }
}

analyzeExistingUser();








