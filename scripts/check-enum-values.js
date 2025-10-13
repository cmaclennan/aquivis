require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkEnumValues() {
  console.log('🔍 Checking user_role ENUM values in remote database...');

  try {
    // Check what roles currently exist in the profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('role')
      .limit(20);
    
    if (profilesError) {
      console.error('❌ Error querying profiles:', profilesError.message);
      return;
    }
    
    const uniqueRoles = [...new Set(profiles.map(p => p.role))];
    console.log(`✅ Current roles in profiles table: ${uniqueRoles.join(', ')}`);
    
    // Check if super_admin role exists
    if (uniqueRoles.includes('super_admin')) {
      console.log('✅ super_admin role exists - migration was applied');
    } else {
      console.log('❌ super_admin role does NOT exist - migration needs to be applied');
      console.log('📋 Next step: Apply sql/ADD_SUPER_ADMIN_STEP_1.sql to remote database');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    process.exit(0);
  }
}

checkEnumValues();








