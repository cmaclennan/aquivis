/**
 * Test Complete User Auth Flow (As Regular User, Not Admin)
 * 
 * Simulates the exact signup/onboarding flow to find RLS issues
 * Run with: npx tsx scripts/test-user-flow.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://krxabrdizqbpitpsvgiv.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyODM1MTIsImV4cCI6MjA3NDg1OTUxMn0.Og1vlRLR4dEMRvYF4POSifY-oxuCEIqifBlWh4q5Kng'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA'

// Client as regular user (with anon key)
const supabase = createClient(SUPABASE_URL, ANON_KEY)

// Client as admin (to clean up)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY)

async function testUserFlow() {
  console.log('🧪 Testing User Auth Flow (As Regular User)\n')

  // First, log in as existing user
  console.log('📝 Step 1: Log in as existing user (craig.maclennan@gmail.com)...')
  
  // Get the user (we know they exist from diagnostic)
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const testUser = users.users.find(u => u.email === 'craig.maclennan@gmail.com')
  
  if (!testUser) {
    console.log('❌ Test user not found')
    return
  }

  console.log(`✅ Found user: ${testUser.id}`)
  console.log('')

  // Set session manually to test as this user
  console.log('📝 Step 2: Testing AS the user (simulating logged-in state)...')
  
  // Create a client with the user's session
  const { data: session } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: testUser.email!
  })
  
  console.log('Session created for testing')
  console.log('')

  // Now test queries AS the user
  console.log('📝 Step 3: Test SELECT companies (what onboarding does)...')
  const { data: companiesSelect, error: selectError } = await supabase
    .from('companies')
    .select('*')

  if (selectError) {
    console.log('❌ SELECT companies FAILED:', selectError.message)
    console.log('   Code:', selectError.code)
    console.log('   Details:', selectError.details)
  } else {
    console.log('✅ SELECT companies succeeded')
    console.log('   Returned:', companiesSelect?.length || 0, 'rows')
  }
  console.log('')

  // Test INSERT
  console.log('📝 Step 4: Test INSERT company (what onboarding does)...')
  const { data: newCompany, error: insertError } = await supabase
    .from('companies')
    .insert({
      name: 'Test Pool Service Co',
      business_type: 'both',
      timezone: 'Australia/Brisbane',
      unit_system: 'metric',
      compliance_jurisdiction: 'QLD'
    })
    .select()
    .single()

  if (insertError) {
    console.log('❌ INSERT company FAILED:', insertError.message)
    console.log('   Code:', insertError.code)
    console.log('   Details:', insertError.details)
    console.log('   Hint:', insertError.hint)
  } else {
    console.log('✅ INSERT company succeeded')
    console.log('   Created company:', newCompany?.name)
    console.log('   Company ID:', newCompany?.id)
    
    // Clean up - delete test company
    await supabaseAdmin.from('companies').delete().eq('id', newCompany!.id)
    console.log('   (Test company deleted)')
  }
  console.log('')

  console.log('🎯 Test complete!')
}

testUserFlow().catch(console.error)

