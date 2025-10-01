/**
 * Check all properties and their has_individual_units flags
 */

const { createClient } = require('@supabase/supabase-js');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI4MzUxMiwiZXhwIjoyMDc0ODU5NTEyfQ.Luo0fHJBTaEryHc2pXjlPsELkG_3yk-swZ6IntUC0fA';

const supabase = createClient(
  'https://krxabrdizqbpitpsvgiv.supabase.co',
  SERVICE_KEY
);

async function checkProperties() {
  console.log('🔍 Checking all properties...\n');

  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, name, property_type, has_individual_units')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (properties.length === 0) {
      console.log('No properties found.\n');
      return;
    }

    console.log('Properties in database:\n');
    properties.forEach((prop, index) => {
      console.log(`${index + 1}. ${prop.name}`);
      console.log(`   ID: ${prop.id}`);
      console.log(`   Type: ${prop.property_type}`);
      console.log(`   has_individual_units: ${prop.has_individual_units}`);
      console.log(`   Expected Display: ${prop.has_individual_units ? 'Separate "Pools" and "Spas" sections' : 'Single "Property Pools & Spas" section'}`);
      console.log('');
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkProperties();

