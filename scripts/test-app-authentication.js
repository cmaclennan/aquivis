const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testAppAuthentication() {
  console.log('🔍 Testing App Authentication Flow...\n')

  // Test 1: Check if we can simulate the app's authentication flow
  console.log('1. Testing authentication flow...')
  
  try {
    // This simulates what the app does in the dashboard page
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log(`❌ User error: ${userError.message}`)
    } else if (user) {
      console.log(`✅ User authenticated: ${user.email}`)
      
      // Test 2: Try to get profile like the app does
      console.log('\n2. Testing profile lookup...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.log(`❌ Profile error: ${profileError.message}`)
      } else if (profile) {
        console.log(`✅ Profile found: ${profile.first_name} ${profile.last_name}`)
        console.log(`   Company: ${profile.companies?.name || 'No company'}`)
        console.log(`   Company ID: ${profile.company_id}`)
        
        // Test 3: Try dashboard query like the app does
        if (profile.company_id) {
          console.log('\n3. Testing dashboard query with company_id...')
          const { data: dashboardStats, error: dashboardError } = await supabase
            .from('dashboard_stats_optimized')
            .select('*')
            .eq('company_id', profile.company_id)
            .single()
          
          if (dashboardError) {
            console.log(`❌ Dashboard error: ${dashboardError.message}`)
          } else {
            console.log(`✅ Dashboard query successful`)
            console.log(`   Company: ${dashboardStats.company_name}`)
            console.log(`   Properties: ${dashboardStats.property_count}`)
            console.log(`   Units: ${dashboardStats.unit_count}`)
          }
        }
      }
    } else {
      console.log('❌ No user authenticated - this explains the app failure!')
      console.log('   The app requires authentication to work properly')
    }
  } catch (err) {
    console.log(`❌ Auth flow error: ${err.message}`)
  }

  // Test 4: Check if the issue is with the anon key vs service role
  console.log('\n4. Testing with different authentication methods...')
  
  // Test if views work with anon key (they shouldn't if RLS is properly configured)
  try {
    const { data, error } = await supabase
      .from('dashboard_stats_optimized')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ Anon key access blocked: ${error.message}`)
      console.log(`   This is GOOD - RLS is working properly`)
    } else {
      console.log(`⚠️  Anon key access allowed: ${data?.length || 0} rows`)
      console.log(`   This might be BAD - views should be protected by RLS`)
    }
  } catch (err) {
    console.log(`❌ Anon key test error: ${err.message}`)
  }

  console.log('\n🎯 Authentication Analysis Complete!')
  console.log('\nIf no user is authenticated, the app will fail because:')
  console.log('1. The dashboard page requires a user to get company_id')
  console.log('2. RLS policies should block access to views without authentication')
  console.log('3. The views working without auth suggests RLS might not be properly configured')
}

testAppAuthentication().catch(console.error)

