/**
 * Apply RLS Fix via Direct PostgreSQL Connection
 * Run: node scripts/apply-rls-postgres.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read SQL file
const sqlFile = path.join(__dirname, '..', 'FIX_RLS_COMPANIES_FINAL.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Database connection
// NOTE: Replace YOUR_DB_PASSWORD with actual password from Supabase Dashboard
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.krxabrdizqbpitpsvgiv:[YOUR_DB_PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';

async function applyFix() {
  console.log('🔧 Applying RLS Fix via PostgreSQL...\n');

  if (connectionString.includes('[YOUR_DB_PASSWORD]')) {
    console.log('❌ Database password not set!\n');
    console.log('📋 Option 1: Set environment variable:');
    console.log('   $env:DATABASE_URL="postgresql://postgres.krxabrdizqbpitpsvgiv:[PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"');
    console.log('   node scripts/apply-rls-postgres.js\n');
    console.log('📋 Option 2: Get password from Supabase:');
    console.log('   Dashboard → Settings → Database → Connection string\n');
    console.log('📋 Option 3: Run SQL manually:');
    console.log('   Dashboard → SQL Editor → Run FIX_RLS_COMPANIES_FINAL.sql\n');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📝 Executing SQL...');
    await client.query(sql);
    console.log('✅ SQL executed successfully!\n');

    // Verify
    console.log('🔍 Verifying policies...');
    const result = await client.query(`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE tablename = 'companies'
      ORDER BY policyname
    `);

    console.log(`   Found ${result.rows.length} policies:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.policyname} (${row.cmd})`);
    });

    console.log('\n✅ RLS Fix Applied Successfully!');
    console.log('🧪 Test at: http://localhost:3000/onboarding\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 FALLBACK: Run SQL manually in Supabase SQL Editor');
    console.log('   File: FIX_RLS_COMPANIES_FINAL.sql\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyFix();

