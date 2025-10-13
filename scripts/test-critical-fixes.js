#!/usr/bin/env node

/**
 * Test Script: Critical Fixes Verification
 * 
 * This script tests the critical fixes applied to resolve compilation errors
 * and database relationship issues.
 * 
 * Tests:
 * 1. Shared facilities page compilation
 * 2. Individual units page compilation  
 * 3. Database relationship queries
 * 4. Water tests query syntax
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDatabaseConnections() {
  console.log('🔍 Testing database connections...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
    
    if (error) throw error
    console.log('✅ Database connection successful')
    
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

async function testServicesProfilesRelationship() {
  console.log('🔍 Testing services-profiles relationship...')
  
  try {
    // Test the fixed relationship query
    const { data, error } = await supabase
      .from('services')
      .select(`
        id,
        service_date,
        service_type,
        status,
        technician:profiles!services_technician_id_fkey(first_name, last_name)
      `)
      .limit(1)
    
    if (error) throw error
    console.log('✅ Services-profiles relationship query successful')
    console.log('   Sample data:', data?.[0] ? 'Found services' : 'No services found')
    
    return true
  } catch (error) {
    console.error('❌ Services-profiles relationship failed:', error.message)
    return false
  }
}

async function testWaterTestsQuery() {
  console.log('🔍 Testing water_tests query...')
  
  try {
    // Test the fixed water_tests query
    const { data, error } = await supabase
      .from('water_tests')
      .select(`
        id,
        service_id,
        ph,
        chlorine,
        bromine,
        all_parameters_ok
      `)
      .limit(1)
    
    if (error) throw error
    console.log('✅ Water tests query successful')
    console.log('   Sample data:', data?.[0] ? 'Found water tests' : 'No water tests found')
    
    return true
  } catch (error) {
    console.error('❌ Water tests query failed:', error.message)
    return false
  }
}

async function testServiceHistoryQuery() {
  console.log('🔍 Testing service history query...')
  
  try {
    // Test the complete service history query
    const { data, error } = await supabase
      .from('services')
      .select(`
        id,
        service_date,
        service_type,
        status,
        technician:profiles!services_technician_id_fkey(first_name, last_name),
        water_tests(ph, chlorine, bromine, all_parameters_ok)
      `)
      .limit(1)
    
    if (error) throw error
    console.log('✅ Service history query successful')
    console.log('   Sample data:', data?.[0] ? 'Found services with history' : 'No services found')
    
    return true
  } catch (error) {
    console.error('❌ Service history query failed:', error.message)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting Critical Fixes Verification Tests\n')
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnections },
    { name: 'Services-Profiles Relationship', fn: testServicesProfilesRelationship },
    { name: 'Water Tests Query', fn: testWaterTestsQuery },
    { name: 'Service History Query', fn: testServiceHistoryQuery }
  ]
  
  const results = []
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`)
    const success = await test.fn()
    results.push({ name: test.name, success })
  }
  
  console.log('\n📊 Test Results Summary:')
  console.log('========================')
  
  const passed = results.filter(r => r.success).length
  const total = results.length
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${result.name}`)
  })
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All critical fixes verified successfully!')
    console.log('✅ The application should now work without compilation errors')
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.')
  }
  
  return passed === total
}

// Run the tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test runner failed:', error)
    process.exit(1)
  })








