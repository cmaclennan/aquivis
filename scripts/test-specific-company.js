const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testSpecificCompany() {
  console.log('🔍 Testing specific company: 88a16083-7a28-48ce-b710-92837af61677\n')

  const companyId = '88a16083-7a28-48ce-b710-92837af61677'

  // Test 1: Check dashboard_stats_optimized for this company
  console.log('1. Testing dashboard_stats_optimized...')
  try {
    const { data, error } = await supabase
      .from('dashboard_stats_optimized')
      .select('*')
      .eq('company_id', companyId)
      .single()
    
    if (error) {
      console.log(`❌ dashboard_stats_optimized: ${error.message}`)
    } else {
      console.log(`✅ dashboard_stats_optimized: Found data`)
      console.log(`   Company: ${data.company_name}`)
      console.log(`   Properties: ${data.property_count}`)
      console.log(`   Units: ${data.unit_count}`)
      console.log(`   Services: ${data.total_services}`)
    }
  } catch (err) {
    console.log(`❌ dashboard_stats_optimized error: ${err.message}`)
  }

  // Test 2: Check services_optimized for this company
  console.log('\n2. Testing services_optimized...')
  try {
    const { data, error } = await supabase
      .from('services_optimized')
      .select('*')
      .eq('company_id', companyId)
      .limit(5)
    
    if (error) {
      console.log(`❌ services_optimized: ${error.message}`)
    } else {
      console.log(`✅ services_optimized: ${data?.length || 0} rows`)
      if (data && data.length > 0) {
        console.log(`   First service: ${data[0].service_type} on ${data[0].service_date}`)
        console.log(`   Technician: ${data[0].technician_name}`)
      }
    }
  } catch (err) {
    console.log(`❌ services_optimized error: ${err.message}`)
  }

  // Test 3: Check properties_optimized for this company
  console.log('\n3. Testing properties_optimized...')
  try {
    const { data, error } = await supabase
      .from('properties_optimized')
      .select('*')
      .eq('company_id', companyId)
      .limit(5)
    
    if (error) {
      console.log(`❌ properties_optimized: ${error.message}`)
    } else {
      console.log(`✅ properties_optimized: ${data?.length || 0} rows`)
      if (data && data.length > 0) {
        console.log(`   Properties: ${data.map(p => p.name).join(', ')}`)
      }
    }
  } catch (err) {
    console.log(`❌ properties_optimized error: ${err.message}`)
  }

  // Test 4: Check units_optimized for this company
  console.log('\n4. Testing units_optimized...')
  try {
    const { data, error } = await supabase
      .from('units_optimized')
      .select('*')
      .eq('company_id', companyId)
      .limit(5)
    
    if (error) {
      console.log(`❌ units_optimized: ${error.message}`)
    } else {
      console.log(`✅ units_optimized: ${data?.length || 0} rows`)
      if (data && data.length > 0) {
        console.log(`   Units: ${data.map(u => u.name).join(', ')}`)
      }
    }
  } catch (err) {
    console.log(`❌ units_optimized error: ${err.message}`)
  }

  // Test 5: Check customers_optimized for this company
  console.log('\n5. Testing customers_optimized...')
  try {
    const { data, error } = await supabase
      .from('customers_optimized')
      .select('*')
      .eq('company_id', companyId)
      .limit(5)
    
    if (error) {
      console.log(`❌ customers_optimized: ${error.message}`)
    } else {
      console.log(`✅ customers_optimized: ${data?.length || 0} rows`)
      if (data && data.length > 0) {
        console.log(`   Customers: ${data.map(c => c.name).join(', ')}`)
      }
    }
  } catch (err) {
    console.log(`❌ customers_optimized error: ${err.message}`)
  }

  console.log('\n🎯 Company-specific test complete!')
}

testSpecificCompany().catch(console.error)

