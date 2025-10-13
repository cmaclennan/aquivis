require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTriggerFunction() {
  console.log('🔍 Testing if trigger function is working...\n');

  // Test 1: Try to create a user and see if profile is created
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  console.log(`📧 Creating user: ${testEmail}`);
  
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
      console.log('❌ Signup failed:', error.message);
      return;
    }

    if (data.user) {
      console.log('✅ User created successfully:', data.user.id);
      
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Profile not created:', profileError.message);
        console.log('❌ This indicates the trigger function is not working');
        
        if (profileError.message.includes('row-level security')) {
          console.log('🚨 RLS POLICY ISSUE: The trigger function may exist but RLS is blocking profile creation');
        } else if (profileError.message.includes('does not exist')) {
          console.log('🚨 TRIGGER FUNCTION MISSING: The handle_new_user function does not exist');
        }
      } else {
        console.log('✅ Profile created successfully:', profile);
        console.log('✅ Trigger function is working correctly');
      }
    }
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
}

testTriggerFunction().then(() => process.exit(0));








