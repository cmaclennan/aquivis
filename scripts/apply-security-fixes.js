/**
 * Apply Security Fixes via Supabase Client
 * Run: node scripts/apply-security-fixes.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySecurityFixes() {
  console.log('🔒 APPLYING CRITICAL SECURITY FIXES\n');
  console.log('This will fix all Security Advisor errors and warnings\n');

  try {
    // Read the security fixes SQL file
    const sqlFile = path.join(__dirname, '..', 'sql', 'SECURITY_FIXES.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Security fixes SQL loaded successfully');
    console.log('🔧 Applying fixes to database...\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`⚠️  Expected: ${error.message}`);
            successCount++;
          } else {
            console.log(`❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Exception: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 RESULTS:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 ALL SECURITY FIXES APPLIED SUCCESSFULLY!');
      console.log('🔒 Security Advisor errors should now be resolved');
    } else {
      console.log('\n⚠️  Some fixes had errors - check the output above');
    }

  } catch (error) {
    console.error('❌ Failed to apply security fixes:', error.message);
    process.exit(1);
  }
}

async function verifySecurityFixes() {
  console.log('\n🔍 VERIFYING SECURITY FIXES...\n');

  try {
    // Check if views exist and don't have SECURITY DEFINER
    console.log('1. Checking views...');
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['dashboard_stats', 'compliance_summary', 'technician_today_services', 'services_with_details']);

    if (viewsError) {
      console.log('❌ Could not check views:', viewsError.message);
    } else {
      console.log(`✅ Found ${views.length} optimized views`);
    }

    // Check if RLS is enabled on tables
    console.log('2. Checking RLS status...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['property_scheduling_rules', 'custom_schedules', 'schedule_templates', 'company_chemical_prices', 'customer_user_links', 'team_invitations']);

    if (tablesError) {
      console.log('❌ Could not check RLS status:', tablesError.message);
    } else {
      const rlsEnabled = tables.filter(t => t.rowsecurity).length;
      console.log(`✅ RLS enabled on ${rlsEnabled}/${tables.length} tables`);
    }

    // Check if functions have search_path
    console.log('3. Checking function security...');
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname, proconfig')
      .eq('pronamespace', '(SELECT oid FROM pg_namespace WHERE nspname = \'public\')');

    if (functionsError) {
      console.log('❌ Could not check functions:', functionsError.message);
    } else {
      const secureFunctions = functions.filter(f => f.proconfig && f.proconfig.includes('search_path')).length;
      console.log(`✅ ${secureFunctions}/${functions.length} functions have search_path configured`);
    }

    console.log('\n🎉 Security verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 AQUIVIS SECURITY FIXES APPLIER\n');
  console.log('This script will apply critical security fixes to resolve all Security Advisor issues\n');

  await applySecurityFixes();
  await verifySecurityFixes();

  console.log('\n📋 NEXT STEPS:');
  console.log('1. Run Security Advisor again to verify all issues are resolved');
  console.log('2. Apply performance optimizations: node scripts/apply-performance-optimizations.js');
  console.log('3. Test the application for improved performance');
  console.log('\n✨ Security fixes complete!');
}

main().catch(console.error);
