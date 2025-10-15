const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function diagnoseRLSPolicies() {
  console.log('🔍 Diagnosing RLS Policies...\n')

  // Test 1: Check current user and session
  console.log('1. Checking authentication status...')
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.log(`❌ User error: ${userError.message}`)
    } else if (user) {
      console.log(`✅ User authenticated: ${user.email}`)
    } else {
      console.log('❌ No user authenticated')
    }
  } catch (err) {
    console.log(`❌ Auth error: ${err.message}`)
  }

  // Test 2: Check RLS status on key tables
  console.log('\n2. Checking RLS status on key tables...')
  const tables = ['companies', 'profiles', 'properties', 'units', 'services', 'customers']
  
  for (const tableName of tables) {
    try {
      // Try to query the table directly
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
        if (error.message.includes('RLS')) {
          console.log(`   → RLS is blocking access to ${tableName}`)
        }
      } else {
        console.log(`✅ ${tableName}: Accessible (${data?.length || 0} rows)`)
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`)
    }
  }

  // Test 3: Check if we can access data through views vs direct tables
  console.log('\n3. Comparing view access vs direct table access...')
  
  // Test dashboard_stats_optimized (which works)
  try {
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('dashboard_stats_optimized')
      .select('*')
      .limit(1)
    
    if (dashboardError) {
      console.log(`❌ dashboard_stats_optimized: ${dashboardError.message}`)
    } else {
      console.log(`✅ dashboard_stats_optimized: ${dashboardData?.length || 0} rows`)
    }
  } catch (err) {
    console.log(`❌ dashboard_stats_optimized error: ${err.message}`)
  }

  // Test services_optimized (which might be failing)
  try {
    const { data: servicesData, error: servicesError } = await supabase
      .from('services_optimized')
      .select('*')
      .limit(1)
    
    if (servicesError) {
      console.log(`❌ services_optimized: ${servicesError.message}`)
    } else {
      console.log(`✅ services_optimized: ${servicesData?.length || 0} rows`)
    }
  } catch (err) {
    console.log(`❌ services_optimized error: ${err.message}`)
  }

  // Test 4: Check if we can query with company_id filter
  console.log('\n4. Testing company_id filtering...')
  try {
    // First get a company_id from the working dashboard view
    const { data: dashboardStats } = await supabase
      .from('dashboard_stats_optimized')
      .select('company_id')
      .limit(1)
    
    if (dashboardStats && dashboardStats.length > 0) {
      const companyId = dashboardStats[0].company_id
      console.log(`Testing with company_id: ${companyId}`)
      
      const { data: servicesData, error: servicesError } = await supabase
        .from('services_optimized')
        .select('*')
        .eq('company_id', companyId)
        .limit(1)
      
      if (servicesError) {
        console.log(`❌ services_optimized with company_id filter: ${servicesError.message}`)
      } else {
        console.log(`✅ services_optimized with company_id filter: ${servicesData?.length || 0} rows`)
      }
    } else {
      console.log('❌ No company_id found in dashboard_stats_optimized')
    }
  } catch (err) {
    console.log(`❌ Company ID filter test error: ${err.message}`)
  }

  console.log('\n🎯 RLS Diagnosis Complete!')
  console.log('\nIf RLS is blocking access, we may need to:')
  console.log('1. Review and fix RLS policies on underlying tables')
  console.log('2. Ensure views have proper SECURITY DEFINER permissions')
  console.log('3. Check if policies are too restrictive for the authenticated role')
}

diagnoseRLSPolicies().catch(console.error)

