-- SIMPLE TRIGGER FIX - Use a different approach
-- The issue is likely that the trigger is running before the user is fully committed

-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Create a simple trigger function that doesn't fail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Just return NEW without doing anything for now
  -- This will let us test if the trigger itself is the problem
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Test if this fixes the signup
-- If signup works with this empty trigger, then the issue is with the profile insertion
-- If signup still fails, then the issue is with the trigger system itself

-- Step 5: Verify the trigger was created
SELECT 
  tgname as trigger_name,
  relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname = 'on_auth_user_created';






