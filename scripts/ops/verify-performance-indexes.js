require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // needs service key to query pg_catalog
)

async function run() {
  console.log('🔍 Verifying performance indexes...')

  const expected = [
    'idx_properties_company',
    'idx_customers_company',
    'idx_units_property',
    'idx_units_customer',
    'idx_services_property_date',
    'idx_services_unit',
    'idx_bookings_unit_dates',
    'idx_profiles_company',
  ]

  const { data, error } = await supabase
    .from('pg_indexes')
    .select('indexname, tablename, schemaname')
    .eq('schemaname', 'public')
    .in('indexname', expected)

  if (error) {
    console.error('❌ Unable to query pg_indexes via anon role:', error.message)
    console.error('ℹ️  Use the Supabase SQL editor to run the verification query at the end of the SQL file.')
    process.exit(1)
  }

  const present = new Set((data || []).map((r) => r.indexname))
  const missing = expected.filter((n) => !present.has(n))

  if (missing.length === 0) {
    console.log('✅ All expected indexes are present.')
  } else {
    console.log('⚠️ Missing indexes:', missing.join(', '))
  }
}

run().catch((e) => {
  console.error('❌ Verification failed:', e?.message || e)
  process.exit(1)
})


