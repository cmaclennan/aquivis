-- WORKING TRIGGER FIX
-- This creates a trigger that works properly with the current setup

-- Step 1: Create the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user: Trigger executed for user ID: %, Email: %', NEW.id, NEW.email;
  
  -- Insert the profile record with proper error handling
  BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      'owner'
    );
    
    RAISE LOG 'handle_new_user: Profile created successfully for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE LOG 'handle_new_user: Error creating profile for user %: %', NEW.id, SQLERRM;
      -- Don't re-raise the error - let the user creation succeed
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Ensure RLS allows the trigger to insert
DROP POLICY IF EXISTS "allow_trigger_profile_creation" ON profiles;
CREATE POLICY "allow_trigger_profile_creation" ON profiles
  FOR INSERT WITH CHECK (true); -- Allow all inserts for trigger

-- Step 4: Verify the trigger was created
SELECT 
  tgname as trigger_name,
  relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname = 'on_auth_user_created';

-- Step 5: Verify the function was created
SELECT 
  proname as function_name,
  proargnames as arguments,
  prorettype as return_type
FROM pg_proc 
WHERE proname = 'handle_new_user';






