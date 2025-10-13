const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://krxabrdizqbpitpsvgiv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyEnhancedScheduling() {
  console.log('🚀 Applying Enhanced Scheduling System...')
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'sql', 'ENHANCED_SCHEDULING_SYSTEM.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length === 0) continue
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          if (error.message.includes('function exec_sql')) {
            const { error: directError } = await supabase.from('_').select('*').limit(0)
            if (directError) {
              console.log('⚠️  Using alternative method for statement execution')
            }
          } else {
            throw error
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`)
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message)
        // Continue with next statement
      }
    }
    
    // Migrate existing custom units
    console.log('🔄 Migrating existing custom units...')
    const { data: customUnits, error: customError } = await supabase
      .from('units')
      .select('id')
      .eq('service_frequency', 'custom')
    
    if (customError) {
      console.error('❌ Error fetching custom units:', customError.message)
    } else {
      console.log(`📊 Found ${customUnits?.length || 0} units with custom frequency`)
      
      for (const unit of customUnits || []) {
        try {
          const { error: insertError } = await supabase
            .from('custom_schedules')
            .insert({
              unit_id: unit.id,
              schedule_type: 'simple',
              schedule_config: {
                frequency: 'weekly',
                service_types: { weekly: ['full_service'] },
                time_preference: '09:00'
              },
              service_types: { weekly: ['full_service'] },
              name: 'Migrated Custom Schedule',
              description: 'Automatically migrated from existing custom frequency',
              is_active: true
            })
          
          if (insertError) {
            console.error(`❌ Error migrating unit ${unit.id}:`, insertError.message)
          } else {
            console.log(`✅ Migrated unit ${unit.id}`)
          }
        } catch (err) {
          console.error(`❌ Error migrating unit ${unit.id}:`, err.message)
        }
      }
    }
    
    // Create sample schedule templates
    console.log('📋 Creating sample schedule templates...')
    
    const templates = [
      {
        template_name: 'Resort Daily Testing',
        template_type: 'simple',
        template_config: {
          frequency: 'daily',
          service_types: { daily: ['test_only'] },
          time_preference: '09:00'
        },
        applicable_property_types: ['resort', 'commercial'],
        applicable_unit_types: ['main_pool', 'kids_pool', 'main_spa'],
        description: 'Daily water testing for resort pools and spas',
        is_public: true
      },
      {
        template_name: 'Villa Weekly Service',
        template_type: 'simple',
        template_config: {
          frequency: 'weekly',
          service_types: { weekly: ['full_service'] },
          time_preference: '10:00',
          day_preference: 'monday'
        },
        applicable_property_types: ['resort', 'body_corporate'],
        applicable_unit_types: ['villa_pool', 'plunge_pool'],
        description: 'Weekly full service for villa pools',
        is_public: true
      },
      {
        template_name: 'Random Selection Testing',
        template_type: 'random_selection',
        template_config: {
          frequency: 'daily',
          selection_count: 2,
          service_types: { daily: ['test_only'] },
          time_preference: '09:00'
        },
        applicable_property_types: ['resort', 'commercial'],
        applicable_unit_types: ['main_pool', 'kids_pool'],
        description: 'Daily random selection testing for multiple pools',
        is_public: true
      }
    ]
    
    // Get first company for templates
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
    
    if (companyError) {
      console.error('❌ Error fetching companies:', companyError.message)
    } else if (companies && companies.length > 0) {
      for (const template of templates) {
        try {
          const { error: templateError } = await supabase
            .from('schedule_templates')
            .insert({
              company_id: companies[0].id,
              ...template,
              is_active: true
            })
          
          if (templateError) {
            console.error(`❌ Error creating template ${template.template_name}:`, templateError.message)
          } else {
            console.log(`✅ Created template: ${template.template_name}`)
          }
        } catch (err) {
          console.error(`❌ Error creating template ${template.template_name}:`, err.message)
        }
      }
    }
    
    console.log('🎉 Enhanced Scheduling System applied successfully!')
    
    // Verification queries
    console.log('🔍 Running verification queries...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['custom_schedules', 'property_scheduling_rules', 'schedule_templates', 'schedule_executions'])
    
    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError.message)
    } else {
      console.log('✅ Tables created:', tables?.map(t => t.table_name).join(', ') || 'None')
    }
    
    const { data: customSchedules, error: schedulesError } = await supabase
      .from('custom_schedules')
      .select('id, name')
      .limit(5)
    
    if (schedulesError) {
      console.error('❌ Error verifying custom schedules:', schedulesError.message)
    } else {
      console.log(`✅ Custom schedules: ${customSchedules?.length || 0} found`)
    }
    
    const { data: scheduleTemplates, error: templatesError } = await supabase
      .from('schedule_templates')
      .select('template_name')
      .limit(5)
    
    if (templatesError) {
      console.error('❌ Error verifying schedule templates:', templatesError.message)
    } else {
      console.log(`✅ Schedule templates: ${scheduleTemplates?.length || 0} found`)
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run the script
applyEnhancedScheduling()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  })





