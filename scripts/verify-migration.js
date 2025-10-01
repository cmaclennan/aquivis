/**
 * Verify has_individual_units migration
 */

const { createClient } = require('@supabase/supabase-js');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA';

const supabase = createClient(
  'https://krxabrdizqbpitpsvgiv.supabase.co',
  SERVICE_KEY
);

async function verify() {
  console.log('🔍 Verifying has_individual_units migration...\n');

  try {
    // Test 1: Try to query with the new column
    console.log('1️⃣ Testing column exists...');
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, property_type, has_individual_units')
      .limit(5);

    if (error) {
      console.log('   ❌ Column not found or error:', error.message);
      return false;
    }

    console.log('   ✅ Column exists!\n');

    // Test 2: Show sample data
    if (data && data.length > 0) {
      console.log('2️⃣ Sample properties:');
      data.forEach(prop => {
        console.log(`   - ${prop.name}`);
        console.log(`     Type: ${prop.property_type}`);
        console.log(`     Has Individual Units: ${prop.has_individual_units || false}`);
        console.log('');
      });
    } else {
      console.log('2️⃣ No properties found yet (this is fine for new installations)\n');
    }

    console.log('✅ Migration verified successfully!\n');
    console.log('Next steps:');
    console.log('  1. Make sure dev server is running (npm run dev)');
    console.log('  2. Create a new property and test the checkbox');
    console.log('  3. Edit an existing property to toggle the flag');
    console.log('  4. View property detail page to see conditional rendering\n');

    return true;

  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    return false;
  }
}

verify().then((success) => {
  process.exit(success ? 0 : 1);
});

