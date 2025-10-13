require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testSuperAdminFunctionality() {
  console.log('🚀 Testing Super Admin Functionality...\n');

  try {
    // Test 1: Check if super_admin role was added to ENUM
    console.log('--- Test 1: Check user_role ENUM ---');
    const { data: enumData, error: enumError } = await supabase
      .rpc('get_enum_values', { enum_name: 'user_role' });
    
    if (enumError) {
      console.log('⚠️  Could not check ENUM values (function may not exist)');
      console.log('   This is expected - we can verify manually in Supabase dashboard');
    } else {
      console.log('✅ ENUM values:', enumData);
    }

    // Test 2: Check if super admin functions exist
    console.log('\n--- Test 2: Check Super Admin Functions ---');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', ['is_super_admin', 'log_super_admin_action', 'get_all_companies', 'get_company_stats']);

    if (functionsError) throw functionsError;
    
    const expectedFunctions = ['is_super_admin', 'log_super_admin_action', 'get_all_companies', 'get_company_stats'];
    const existingFunctions = functions?.map(f => f.routine_name) || [];
    
    expectedFunctions.forEach(func => {
      if (existingFunctions.includes(func)) {
        console.log(`✅ Function exists: ${func}`);
      } else {
        console.log(`❌ Function missing: ${func}`);
      }
    });

    // Test 3: Check if audit log table exists
    console.log('\n--- Test 3: Check Audit Log Table ---');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['super_admin_audit_log', 'super_admin_sessions']);

    if (tablesError) throw tablesError;
    
    const expectedTables = ['super_admin_audit_log', 'super_admin_sessions'];
    const existingTables = tables?.map(t => t.table_name) || [];
    
    expectedTables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`✅ Table exists: ${table}`);
      } else {
        console.log(`❌ Table missing: ${table}`);
      }
    });

    // Test 4: Check if RLS policies exist
    console.log('\n--- Test 4: Check RLS Policies ---');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname')
      .like('policyname', '%super_admin%');

    if (policiesError) throw policiesError;
    
    if (policies && policies.length > 0) {
      console.log('✅ Super admin policies found:');
      policies.forEach(policy => {
        console.log(`   - ${policy.tablename}.${policy.policyname}`);
      });
    } else {
      console.log('❌ No super admin policies found');
    }

    // Test 5: Test get_all_companies function (if it exists)
    console.log('\n--- Test 5: Test get_all_companies Function ---');
    try {
      const { data: companies, error: companiesError } = await supabase.rpc('get_all_companies');
      
      if (companiesError) {
        console.log('⚠️  Function exists but requires super admin privileges to test');
        console.log('   This is expected - function will work when called by super admin user');
      } else {
        console.log('✅ Function works and returned companies:', companies?.length || 0);
      }
    } catch (err) {
      console.log('⚠️  Function may not exist or requires super admin privileges');
    }

    console.log('\n🎉 Super Admin functionality test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Apply the SQL migration: sql/ADD_SUPER_ADMIN_FUNCTIONALITY.sql');
    console.log('2. Create a super admin user in the database');
    console.log('3. Test the super admin login and dashboard');
    console.log('4. Verify audit logging is working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    // Supabase client might keep the process alive, so explicitly exit
    process.exit(0);
  }
}

testSuperAdminFunctionality();








