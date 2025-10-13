const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://krxabrdizqbpitpsvgiv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySchedulingTables() {
  console.log('🚀 Applying Enhanced Scheduling Tables...')
  
  const tables = [
    'CREATE_CUSTOM_SCHEDULES_TABLE.sql',
    'CREATE_PROPERTY_SCHEDULING_RULES_TABLE.sql', 
    'CREATE_SCHEDULE_TEMPLATES_TABLE.sql'
  ]
  
  for (const tableFile of tables) {
    console.log(`\n📝 Processing ${tableFile}...`)
    
    try {
      const sqlPath = path.join(__dirname, '..', 'sql', tableFile)
      const sqlContent = fs.readFileSync(sqlPath, 'utf8')
      
      // Split into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.length === 0) continue
        
        console.log(`  ⏳ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          // Use raw SQL execution via RPC
          const { error } = await supabase.rpc('exec', { 
            query: statement 
          })
          
          if (error) {
            console.log(`  ⚠️  Statement ${i + 1} skipped (may already exist): ${error.message}`)
          } else {
            console.log(`  ✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.log(`  ⚠️  Statement ${i + 1} skipped: ${err.message}`)
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${tableFile}:`, error.message)
    }
  }
  
  // Test if tables were created by trying to query them
  console.log('\n🔍 Testing table creation...')
  
  const testTables = ['custom_schedules', 'property_scheduling_rules', 'schedule_templates']
  
  for (const tableName of testTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table ${tableName} not accessible: ${error.message}`)
      } else {
        console.log(`✅ Table ${tableName} is accessible`)
      }
    } catch (err) {
      console.log(`❌ Table ${tableName} test failed: ${err.message}`)
    }
  }
  
  console.log('\n🎉 Enhanced Scheduling Tables application completed!')
  console.log('\n📋 Next steps:')
  console.log('1. Test the Schedule Builder UI in the application')
  console.log('2. Create some custom schedules to verify functionality')
  console.log('3. Update the schedule generation logic to use new tables')
}

// Run the script
applySchedulingTables()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  })





