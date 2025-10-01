/**
 * Apply Individual Units Flag Migration
 * Adds has_individual_units column to properties table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA';

const supabase = createClient(
  'https://krxabrdizqbpitpsvgiv.supabase.co',
  SERVICE_KEY
);

async function applyMigration() {
  console.log('🔧 Applying Individual Units Migration...\n');

  try {
    // Check if column already exists
    console.log('1️⃣ Checking if migration needed...');
    const { data: testProperty } = await supabase
      .from('properties')
      .select('has_individual_units')
      .limit(1);

    if (testProperty && testProperty.length > 0 && 'has_individual_units' in testProperty[0]) {
      console.log('   ✅ Column already exists - migration not needed\n');
      return true;
    }

    console.log('   Column not found - applying migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'sql', 'MIGRATION_ADD_INDIVIDUAL_UNITS_FLAG.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Apply via direct database connection
    const { Client } = require('pg');
    const connectionString = process.env.DATABASE_URL || "postgresql://postgres.krxabrdizqbpitpsvgiv:JZargnPOC4FwxKyU@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres";
    const client = new Client({ connectionString });

    console.log('2️⃣ Connecting to database...');
    await client.connect();
    console.log('   ✅ Connected\n');

    console.log('3️⃣ Executing migration SQL...');
    await client.query(sql);
    console.log('   ✅ Migration applied\n');

    // Verify
    console.log('4️⃣ Verifying column exists...');
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'has_individual_units'
    `);

    if (result.rows.length > 0) {
      console.log('   ✅ Column verified:');
      console.log(`      Name: ${result.rows[0].column_name}`);
      console.log(`      Type: ${result.rows[0].data_type}`);
      console.log(`      Default: ${result.rows[0].column_default}\n`);
    } else {
      throw new Error('Column not found after migration!');
    }

    await client.end();

    console.log('✅ Migration Complete!\n');
    console.log('Next: Update property forms to include this checkbox\n');
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

applyMigration().then((success) => {
  process.exit(success ? 0 : 1);
});

