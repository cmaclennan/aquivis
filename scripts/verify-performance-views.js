const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifyPerformanceViews() {
  console.log('🔍 Verifying Performance Views...\n')

  const views = [
    'dashboard_stats_optimized',
    'services_optimized', 
    'properties_optimized',
    'units_optimized',
    'customers_optimized'
  ]

  for (const viewName of views) {
    try {
      console.log(`Testing ${viewName}...`)
      
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${viewName}: ${error.message}`)
      } else {
        console.log(`✅ ${viewName}: Working (${data?.length || 0} rows accessible)`)
      }
    } catch (err) {
      console.log(`❌ ${viewName}: ${err.message}`)
    }
  }

  console.log('\n🎯 Performance View Verification Complete!')
  console.log('\nIf all views are working, the app should now use optimized queries.')
  console.log('If any views are missing, apply the SQL script: sql/APPLY_PERFORMANCE_VIEWS.sql')
}

verifyPerformanceViews().catch(console.error)
