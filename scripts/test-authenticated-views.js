require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const testEmail = process.env.TEST_EMAIL
const testPassword = process.env.TEST_PASSWORD

if (!supabaseUrl || !supabaseAnon) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

if (!testEmail || !testPassword) {
  console.error('❌ Missing TEST_EMAIL or TEST_PASSWORD in .env.local')
  console.error('   Add TEST_EMAIL and TEST_PASSWORD to test authenticated view access.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnon)

async function run() {
  console.log('🔐 Testing authenticated access to optimized views...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })
  if (signInError) {
    console.error('❌ Sign-in failed:', signInError.message)
    process.exit(1)
  }
  console.log('✅ Signed in as:', signInData.user?.email)

  const { data: sessionData } = await supabase.auth.getSession()
  console.log('📝 Session active:', Boolean(sessionData.session))

  // Get company_id from dashboard view (fast) or from profile
  let companyId
  const { data: dash, error: dashErr } = await supabase
    .from('dashboard_stats_optimized')
    .select('company_id')
    .limit(1)
  if (!dashErr && dash && dash.length > 0) {
    companyId = dash[0].company_id
  }

  if (!companyId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', signInData.user.id)
      .single()
    companyId = profile?.company_id
  }

  console.log('🏢 Using company_id:', companyId || '(none)')

  const { data: dashData, error: dashError } = await supabase
    .from('dashboard_stats_optimized')
    .select('*')
    .limit(1)
  if (dashError) {
    console.error('❌ dashboard_stats_optimized error:', dashError.message)
  } else {
    console.log('✅ dashboard_stats_optimized ok:', dashData?.length || 0, 'rows')
  }

  let servicesQuery = supabase.from('services_optimized').select('*').limit(5)
  if (companyId) servicesQuery = servicesQuery.eq('company_id', companyId)
  const { data: services, error: servicesErr } = await servicesQuery
  if (servicesErr) {
    console.error('❌ services_optimized error:', servicesErr.message)
  } else {
    console.log('✅ services_optimized ok:', services?.length || 0, 'rows')
  }

  await supabase.auth.signOut()
  console.log('🚪 Signed out')
}

run().catch((e) => {
  console.error('❌ Test failed:', e?.message || e)
  process.exit(1)
})


