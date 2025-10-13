require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testSignup() {
  console.log('🧪 Testing user signup...');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
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
      console.log('❌ Signup Error:', error.message);
      console.log('❌ Status:', error.status);
      console.log('❌ Details:', error);
    } else {
      console.log('✅ Signup Success!');
      console.log('✅ User ID:', data.user?.id);
      
      // Check profile
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Profile Error:', profileError.message);
        } else {
          console.log('✅ Profile Created:', profile);
        }
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
  
  process.exit(0);
}

testSignup();








