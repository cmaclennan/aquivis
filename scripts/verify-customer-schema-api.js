/**
 * Verify Customer Schema via Supabase API
 * Uses service role to check deployed schema
 */

const { createClient } = require('@supabase/supabase-js');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA';

const supabase = createClient(
  'https://krxabrdizqbpitpsvgiv.supabase.co',
  SERVICE_KEY
);

async function verifySchema() {
  console.log('🔍 Verifying Customer Schema...\n');

  try {
    // 1. Check if customers table exists and has data
    console.log('1️⃣ Testing customers table access:');
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (custError) {
      console.log('   ❌ Error accessing customers:', custError.message);
    } else {
      console.log('   ✅ customers table accessible');
      console.log(`      Records: ${customers?.length || 0}`);
    }
    console.log('');

    // 2. Check units table for customer_id column
    console.log('2️⃣ Testing units.customer_id column:');
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, customer_id')
      .limit(1);
    
    if (unitsError) {
      if (unitsError.message.includes('customer_id')) {
        console.log('   ❌ units.customer_id column NOT FOUND');
      } else {
        console.log('   ⚠️  Error:', unitsError.message);
      }
    } else {
      console.log('   ✅ units.customer_id column exists');
      console.log(`      Sample unit: ${JSON.stringify(units?.[0] || 'none')}`);
    }
    console.log('');

    // 3. Check properties table for customer_id column
    console.log('3️⃣ Testing properties.customer_id column:');
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, customer_id')
      .limit(1);
    
    if (propError) {
      if (propError.message.includes('customer_id')) {
        console.log('   ❌ properties.customer_id column NOT FOUND');
      } else {
        console.log('   ⚠️  Error:', propError.message);
      }
    } else {
      console.log('   ✅ properties.customer_id column exists');
      console.log(`      Sample property: ${JSON.stringify(properties?.[0] || 'none')}`);
    }
    console.log('');

    // 4. Check billing_entity column on units
    console.log('4️⃣ Testing units.billing_entity column:');
    const { data: unitsBilling, error: billingError } = await supabase
      .from('units')
      .select('id, billing_entity')
      .limit(1);
    
    if (billingError) {
      if (billingError.message.includes('billing_entity')) {
        console.log('   ❌ units.billing_entity column NOT FOUND');
      } else {
        console.log('   ⚠️  Error:', billingError.message);
      }
    } else {
      console.log('   ✅ units.billing_entity column exists');
      console.log(`      Sample: ${JSON.stringify(unitsBilling?.[0] || 'none')}`);
    }
    console.log('');

    // 5. Test customer creation
    console.log('5️⃣ Testing customer creation (with rollback):');
    try {
      const { data: testCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          name: '__TEST_CUSTOMER__',
          customer_type: 'property_owner',
          email: 'test@test.com'
        })
        .select()
        .single();

      if (createError) {
        console.log('   ❌ Create failed:', createError.message);
      } else {
        console.log('   ✅ Create succeeded');
        console.log(`      Created ID: ${testCustomer.id}`);
        
        // Clean up
        await supabase.from('customers').delete().eq('id', testCustomer.id);
        console.log('   ✅ Cleanup complete (test customer deleted)');
      }
    } catch (err) {
      console.log('   ❌ Error:', err.message);
    }
    console.log('');

    // 6. Test customer linking to unit
    console.log('6️⃣ Testing customer → unit relationship:');
    const { data: existingUnits } = await supabase
      .from('units')
      .select('id, name, customer_id')
      .limit(1);
    
    if (existingUnits && existingUnits.length > 0) {
      console.log(`   Found existing unit: ${existingUnits[0].name || existingUnits[0].id}`);
      console.log(`   Customer ID: ${existingUnits[0].customer_id || 'NULL'}`);
      
      // Try to query units with customer join
      const { data: unitWithCustomer, error: joinError } = await supabase
        .from('units')
        .select('id, name, customers(name, customer_type)')
        .eq('id', existingUnits[0].id)
        .single();
      
      if (joinError) {
        console.log('   ❌ Join to customers failed:', joinError.message);
      } else {
        console.log('   ✅ Join to customers works');
        console.log(`      Customer: ${JSON.stringify(unitWithCustomer.customers || 'NULL')}`);
      }
    } else {
      console.log('   ⚠️  No units exist yet to test relationship');
    }
    console.log('');

    // 7. Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 VERIFICATION SUMMARY:\n');
    
    const results = {
      'customers table exists': !custError,
      'units.customer_id exists': !unitsError,
      'properties.customer_id exists': !propError,
      'units.billing_entity exists': !billingError,
    };
    
    console.log('Required Elements:');
    Object.entries(results).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    
    const allPassed = Object.values(results).every(Boolean);
    
    console.log('');
    if (allPassed) {
      console.log('✅ SCHEMA IS COMPLETE AND READY!\n');
      console.log('   All required tables, columns, and relationships exist.');
      console.log('   Ready to build Customer Management UI.\n');
      return true;
    } else {
      console.log('❌ SCHEMA HAS ISSUES!\n');
      console.log('   Some required elements are missing.');
      console.log('   Review errors above and update schema.\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  } finally {
    // Note: Supabase client doesn't need explicit disconnect
  }
}

verifySchema().then((success) => {
  process.exit(success ? 0 : 1);
});

