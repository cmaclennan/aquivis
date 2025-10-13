require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateDeeperIssue() {
  console.log('🔍 DEEPER INVESTIGATION - WHAT IS ACTUALLY HAPPENING?\n');

  try {
    // Test 1: Check if we can create a user directly in the database
    console.log('--- Test 1: Direct Database User Creation ---');
    
    // Let's try to create a user directly in the auth.users table (if possible)
    // This is a long shot, but let's see what happens
    const testEmail = `direct-${Date.now()}@example.com`;
    
    try {
      const { data: directUser, error: directError } = await supabase
        .from('auth.users')
        .insert({
          email: testEmail,
          encrypted_password: 'fake_password_hash',
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (directError) {
        console.log('❌ Cannot create user directly in auth.users:', directError.message);
        console.log('📋 This is expected - auth.users is not directly accessible');
      } else {
        console.log('✅ Direct user creation succeeded:', directUser);
      }
    } catch (err) {
      console.log('❌ Direct user creation failed:', err.message);
    }

    // Test 2: Check if there are any other tables or constraints that might be causing issues
    console.log('\n--- Test 2: Check Database Constraints ---');
    
    // Let's see if we can find any other issues
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10);
    
    if (tablesError) {
      console.log('❌ Cannot query tables:', tablesError.message);
    } else {
      console.log('✅ Found tables:', tables.map(t => t.table_name).join(', '));
    }

    // Test 3: Check if there are any other triggers on the auth.users table
    console.log('\n--- Test 3: Check Other Triggers ---');
    
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table, event_object_schema')
      .eq('event_object_table', 'users')
      .eq('event_object_schema', 'auth');
    
    if (triggersError) {
      console.log('❌ Cannot query triggers:', triggersError.message);
    } else {
      console.log('✅ Found triggers on auth.users:');
      triggers.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name}`);
      });
    }

    // Test 4: Try to understand what's happening by checking if there are any other issues
    console.log('\n--- Test 4: Check for Other Issues ---');
    
    // Let's try to create a profile manually with a fake UUID to see if there are other constraints
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    
    try {
      const { data: fakeProfile, error: fakeError } = await supabase
        .from('profiles')
        .insert({
          id: fakeUuid,
          email: 'fake@example.com',
          first_name: 'Fake',
          last_name: 'User',
          role: 'owner'
        })
        .select()
        .single();
      
      if (fakeError) {
        console.log('❌ Fake profile creation failed:', fakeError.message);
        if (fakeError.message.includes('foreign key')) {
          console.log('🚨 Foreign key constraint issue - profiles.id must reference auth.users.id');
        }
      } else {
        console.log('✅ Fake profile creation succeeded');
        // Clean up
        await supabase.from('profiles').delete().eq('id', fakeUuid);
      }
    } catch (err) {
      console.log('❌ Fake profile test failed:', err.message);
    }

    // Test 5: Check if there are any other RLS policies that might be interfering
    console.log('\n--- Test 5: Check All RLS Policies ---');
    
    const { data: allPolicies, error: allPoliciesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, cmd')
      .eq('tablename', 'profiles');
    
    if (allPoliciesError) {
      console.log('❌ Cannot query all policies:', allPoliciesError.message);
    } else {
      console.log('✅ All RLS policies on profiles table:');
      allPolicies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log('\n🎯 DEEPER INVESTIGATION RESULTS:');
    console.log('📋 This helps us understand:');
    console.log('   1. Whether there are other constraints or issues');
    console.log('   2. Whether there are other triggers interfering');
    console.log('   3. Whether there are other RLS policies blocking');
    console.log('   4. What the actual root cause might be');

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    process.exit(0);
  }
}

investigateDeeperIssue();








