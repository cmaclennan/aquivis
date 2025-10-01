/**
 * Verify Customer Schema Deployment
 * Check if all customer-related tables, columns, and relationships exist
 */

const { Client } = require('pg');

const connectionString = "postgresql://postgres:JZargnPOC4FwxKyU@db.krxabrdizqbpitpsvgiv.supabase.co:5432/postgres";

async function verifySchema() {
  console.log('🔍 Verifying Customer Schema Deployment...\n');

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // 1. Check customers table columns
    console.log('1️⃣ Checking customers table structure:');
    const { rows: customerCols } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'customers'
      ORDER BY ordinal_position
    `);
    
    console.log(`   Found ${customerCols.length} columns:`);
    customerCols.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    console.log('');

    // 2. Check units table for customer_id
    console.log('2️⃣ Checking units.customer_id column:');
    const { rows: unitCustomerCol } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'units' AND column_name = 'customer_id'
    `);
    
    if (unitCustomerCol.length > 0) {
      console.log(`   ✅ units.customer_id exists (${unitCustomerCol[0].data_type})`);
    } else {
      console.log('   ❌ units.customer_id NOT FOUND');
    }
    console.log('');

    // 3. Check properties table for customer_id
    console.log('3️⃣ Checking properties.customer_id column:');
    const { rows: propCustomerCol } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'customer_id'
    `);
    
    if (propCustomerCol.length > 0) {
      console.log(`   ✅ properties.customer_id exists (${propCustomerCol[0].data_type})`);
    } else {
      console.log('   ❌ properties.customer_id NOT FOUND');
    }
    console.log('');

    // 4. Check foreign key constraints
    console.log('4️⃣ Checking foreign key constraints:');
    const { rows: fks } = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (
          (tc.table_name = 'units' AND kcu.column_name = 'customer_id')
          OR (tc.table_name = 'properties' AND kcu.column_name = 'customer_id')
        )
    `);
    
    if (fks.length > 0) {
      fks.forEach(fk => {
        console.log(`   ✅ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name} (ON DELETE ${fk.delete_rule})`);
      });
    } else {
      console.log('   ❌ No customer_id foreign keys found');
    }
    console.log('');

    // 5. Check indexes
    console.log('5️⃣ Checking customer-related indexes:');
    const { rows: indexes } = await client.query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (
          indexname LIKE '%customer%'
        )
      ORDER BY tablename, indexname
    `);
    
    console.log(`   Found ${indexes.length} indexes:`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.tablename}.${idx.indexname}`);
    });
    console.log('');

    // 6. Check RLS policies
    console.log('6️⃣ Checking RLS policies on customers table:');
    const { rows: policies } = await client.query(`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE tablename = 'customers'
      ORDER BY policyname
    `);
    
    if (policies.length > 0) {
      console.log(`   Found ${policies.length} policies:`);
      policies.forEach(p => {
        console.log(`   ✅ ${p.policyname} (${p.cmd})`);
      });
    } else {
      console.log('   ❌ No RLS policies found on customers table');
    }
    console.log('');

    // 7. Check billing_entity enum in units
    console.log('7️⃣ Checking units.billing_entity column:');
    const { rows: billingCol } = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'units' AND column_name = 'billing_entity'
    `);
    
    if (billingCol.length > 0) {
      console.log(`   ✅ units.billing_entity exists (${billingCol[0].data_type})`);
      console.log(`      Default: ${billingCol[0].column_default}`);
    } else {
      console.log('   ❌ units.billing_entity NOT FOUND');
    }
    console.log('');

    // 8. Summary
    console.log('📊 SUMMARY:');
    const checks = [
      customerCols.length > 0,
      unitCustomerCol.length > 0,
      propCustomerCol.length > 0,
      fks.length >= 2,
      indexes.length > 0,
      policies.length > 0,
      billingCol.length > 0
    ];
    
    const passed = checks.filter(Boolean).length;
    console.log(`   ${passed}/7 checks passed\n`);

    if (passed === 7) {
      console.log('✅ Customer schema is COMPLETE and DEPLOYED!\n');
      console.log('   Ready to build customer management UI.\n');
    } else {
      console.log('⚠️  Some checks failed - schema may need updates\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifySchema();

