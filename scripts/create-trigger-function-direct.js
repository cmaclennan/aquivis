require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTriggerFunctionDirect() {
  console.log('🔧 CREATING TRIGGER FUNCTION DIRECTLY\n');

  try {
    // Step 1: Create the function using raw SQL
    console.log('--- Step 1: Creating handle_new_user function ---');
    const { error: createFuncError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, first_name, last_name, role)
          VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            'owner'
          );
          RETURN NEW;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE LOG 'Error in handle_new_user: %', SQLERRM;
            RAISE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (createFuncError) {
      console.log('❌ Failed to create function:', createFuncError.message);
    } else {
      console.log('✅ Function created successfully');
    }

    // Step 2: Create the trigger
    console.log('\n--- Step 2: Creating trigger ---');
    const { error: createTriggerError } = await supabase.rpc('exec_sql', {
      query: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    });

    if (createTriggerError) {
      console.log('❌ Failed to create trigger:', createTriggerError.message);
    } else {
      console.log('✅ Trigger created successfully');
    }

    // Step 3: Test the fix
    console.log('\n--- Step 3: Testing the fix ---');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    const { data: testData, error: testError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (testError) {
      console.log('❌ Test signup failed:', testError.message);
    } else {
      console.log('✅ Test signup succeeded!');
      console.log('✅ User created:', testData.user?.id);
      
      // Check if profile was created
      if (testData.user) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', testData.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Profile creation failed:', profileError.message);
        } else {
          console.log('✅ Profile created successfully by trigger!');
          console.log('📝 Profile data:', profile);
        }
      }
    }

  } catch (error) {
    console.error('❌ Direct creation failed:', error.message);
  } finally {
    process.exit(0);
  }
}

createTriggerFunctionDirect();








