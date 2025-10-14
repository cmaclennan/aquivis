/**
 * Apply Security Fixes via Supabase Client (Simple Approach)
 * Run: node scripts/apply-security-fixes-simple.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful');
    return true;
  } catch (err) {
    console.log('❌ Connection exception:', err.message);
    return false;
  }
}

async function applySecurityFixes() {
  console.log('🔒 APPLYING CRITICAL SECURITY FIXES\n');
  console.log('This will fix all Security Advisor errors and warnings\n');

  let successCount = 0;
  let errorCount = 0;

  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return;
    }

    console.log('\n📋 SECURITY FIXES TO APPLY:');
    console.log('1. Fix SECURITY DEFINER views (4 errors)');
    console.log('2. Enable RLS on missing tables (6 errors)');
    console.log('3. Fix function search_path (14 warnings)');
    console.log('4. Create missing RLS policies (1 info)');

    console.log('\n⚠️  IMPORTANT: Since Supabase client cannot execute arbitrary SQL,');
    console.log('   you need to apply these fixes manually in the Supabase SQL Editor.');
    console.log('\n📄 Please copy and paste the contents of sql/SECURITY_FIXES.sql');
    console.log('   into your Supabase Dashboard → SQL Editor and run it.');

    // Let's at least verify what we can access
    console.log('\n🔍 VERIFYING CURRENT STATE...');

    // Check if we can access the views
    try {
      const { data: views, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ dashboard_stats view error:', error.message);
      } else {
        console.log('✅ dashboard_stats view accessible');
      }
    } catch (err) {
      console.log('❌ dashboard_stats view exception:', err.message);
    }

    // Check if we can access companies table
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name')
        .limit(1);
      
      if (error) {
        console.log('❌ companies table error:', error.message);
      } else {
        console.log('✅ companies table accessible');
      }
    } catch (err) {
      console.log('❌ companies table exception:', err.message);
    }

    console.log('\n📋 MANUAL STEPS REQUIRED:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the contents of sql/SECURITY_FIXES.sql');
    console.log('4. Paste and execute the SQL');
    console.log('5. Run Security Advisor again to verify fixes');

    console.log('\n🎯 EXPECTED RESULTS AFTER MANUAL APPLICATION:');
    console.log('✅ 0 SECURITY DEFINER views');
    console.log('✅ All tables have RLS enabled');
    console.log('✅ All functions have search_path');
    console.log('✅ All RLS policies created');

  } catch (error) {
    console.error('❌ Failed to apply security fixes:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🚀 AQUIVIS SECURITY FIXES APPLIER (SIMPLE)\n');
  console.log('This script will guide you through applying critical security fixes\n');

  await applySecurityFixes();

  console.log('\n📋 NEXT STEPS:');
  console.log('1. Apply sql/SECURITY_FIXES.sql manually in Supabase SQL Editor');
  console.log('2. Run Security Advisor again to verify all issues are resolved');
  console.log('3. Apply performance optimizations');
  console.log('4. Test the application for improved performance');
  console.log('\n✨ Security fixes guidance complete!');
}

main().catch(console.error);
