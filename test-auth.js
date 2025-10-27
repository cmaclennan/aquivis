// Test the auth flow locally
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://krxabrdizqbpitpsvgiv.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA'

const TEST_EMAIL = 'craig.maclennan@gmail.com'
const TEST_PASSWORD = 'password'

async function testAuth() {
  console.log('Testing auth flow...')
  console.log('SUPABASE_URL:', SUPABASE_URL)
  console.log('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')
  
  try {
    // Step 1: Create admin client
    console.log('\n1. Creating Supabase admin client...')
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    console.log('✓ Admin client created')
    
    // Step 2: Query profile
    console.log('\n2. Querying profile for:', TEST_EMAIL)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, company_id')
      .eq('email', TEST_EMAIL)
      .single()
    
    if (profileError) {
      console.error('✗ Profile query error:', profileError)
      return
    }
    
    if (!profile) {
      console.error('✗ No profile found')
      return
    }
    
    console.log('✓ Profile found:', profile)
    
    // Step 3: Verify password
    console.log('\n3. Verifying password...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    
    if (authError) {
      console.error('✗ Password verification error:', authError)
      return
    }
    
    if (!authData.user) {
      console.error('✗ No user returned')
      return
    }
    
    console.log('✓ Password verified, user:', authData.user.email)
    
    console.log('\n✓✓✓ AUTH FLOW SUCCESSFUL ✓✓✓')
    
  } catch (error) {
    console.error('\n✗✗✗ AUTH FLOW FAILED ✗✗✗')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testAuth()

