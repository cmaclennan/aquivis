require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function directSupabaseDiagnosis() {
  console.log('🔍 DIRECT SUPABASE DIAGNOSIS - Using available keys\n');

  // Test 1: Check if we can query the database
  console.log('--- Test 1: Database Connection ---');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
      if (error.message.includes('row-level security')) {
        console.log('🚨 RLS is blocking queries - this confirms RLS is active');
      }
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (err) {
    console.log('❌ Connection exception:', err.message);
  }

  // Test 2: Try to create a user and see the exact error
  console.log('\n--- Test 2: User Creation Test ---');
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
      console.log('❌ Signup failed:', error.message);
      console.log('❌ Error code:', error.code);
      console.log('❌ Error status:', error.status);
      
      // Check if it's a database error
      if (error.message.includes('Database error')) {
        console.log('\n🚨 CONFIRMED: This is a database trigger/function error');
        console.log('📋 The handle_new_user() trigger function is failing');
      }
    } else {
      console.log('✅ Signup succeeded!');
      console.log('✅ User ID:', data.user?.id);
      
      // Check if profile was created
      if (data.user) {
        // Wait a moment for trigger
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Profile creation failed:', profileError.message);
        } else {
          console.log('✅ Profile created successfully');
        }
      }
    }
  } catch (err) {
    console.log('❌ Signup exception:', err.message);
  }

  // Test 3: Check if we can see any existing profiles (to test RLS)
  console.log('\n--- Test 3: RLS Policy Test ---');
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Cannot query profiles:', profilesError.message);
      if (profilesError.message.includes('row-level security')) {
        console.log('🚨 RLS is blocking profile queries');
      }
    } else {
      console.log('✅ Can query profiles (RLS allows it)');
      console.log('📝 Found profiles:', profiles.length);
    }
  } catch (err) {
    console.log('❌ Profile query exception:', err.message);
  }

  console.log('\n🎯 DIAGNOSIS SUMMARY:');
  console.log('📋 Based on the results above, we can determine:');
  console.log('   1. If the trigger function exists and works');
  console.log('   2. If RLS policies are blocking operations');
  console.log('   3. The exact nature of the database error');
}

directSupabaseDiagnosis().then(() => process.exit(0));








