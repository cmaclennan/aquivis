const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function diagnoseViewIssues() {
  console.log('🔍 Diagnosing View Issues...\n')

  // Test 1: Check if views exist
  console.log('1. Checking if views exist...')
  const views = [
    'dashboard_stats_optimized',
    'services_optimized', 
    'properties_optimized',
    'units_optimized',
    'customers_optimized'
  ]

  for (const viewName of views) {
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${viewName}: ${error.message}`)
      } else {
        console.log(`✅ ${viewName}: Accessible (${data?.length || 0} rows)`)
      }
    } catch (err) {
      console.log(`❌ ${viewName}: ${err.message}`)
    }
  }

  // Test 2: Check RLS policies on underlying tables
  console.log('\n2. Checking RLS policies on underlying tables...')
  const tables = ['services', 'properties', 'units', 'customers', 'companies']
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ ${tableName}: Accessible (${data?.length || 0} rows)`)
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`)
    }
  }

  // Test 3: Test services_optimized view specifically with company_id filter
  console.log('\n3. Testing services_optimized with company_id filter...')
  try {
    // First get a company_id to test with
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
    
    if (companies && companies.length > 0) {
      const companyId = companies[0].id
      console.log(`Testing with company_id: ${companyId}`)
      
      const { data, error } = await supabase
        .from('services_optimized')
        .select('*')
        .eq('company_id', companyId)
        .limit(5)
      
      if (error) {
        console.log(`❌ services_optimized with company_id filter: ${error.message}`)
      } else {
        console.log(`✅ services_optimized with company_id filter: ${data?.length || 0} rows`)
      }
    } else {
      console.log('❌ No companies found to test with')
    }
  } catch (err) {
    console.log(`❌ Error testing services_optimized: ${err.message}`)
  }

  // Test 4: Check if the issue is with the JOINs in the view
  console.log('\n4. Testing individual JOINs that make up services_optimized...')
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        properties!inner(
          id,
          name,
          company_id
        ),
        units!inner(
          id,
          name,
          unit_type,
          customers!inner(
            id,
            name,
            email,
            phone
          )
        ),
        profiles!inner(
          id,
          first_name,
          last_name
        )
      `)
      .limit(1)
    
    if (error) {
      console.log(`❌ Services JOIN test: ${error.message}`)
    } else {
      console.log(`✅ Services JOIN test: ${data?.length || 0} rows`)
    }
  } catch (err) {
    console.log(`❌ Services JOIN test error: ${err.message}`)
  }

  console.log('\n🎯 Diagnosis Complete!')
  console.log('\nIf services_optimized is failing, the issue is likely:')
  console.log('1. RLS policies blocking access to underlying tables')
  console.log('2. Missing data relationships causing JOIN failures')
  console.log('3. Permission issues with the authenticated role')
  console.log('4. Complex JOIN structure causing query timeouts')
}

diagnoseViewIssues().catch(console.error)

