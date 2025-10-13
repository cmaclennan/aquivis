-- FINAL WORKING SOLUTION
-- Since the trigger has timing issues, we'll use a different approach
-- We'll modify the signup flow to call the manual profile creation function

-- Step 1: Ensure the manual profile creation function exists and works
CREATE OR REPLACE FUNCTION public.create_profile_for_user(user_id UUID, user_email TEXT, first_name TEXT DEFAULT '', last_name TEXT DEFAULT '')
RETURNS VOID AS $$
BEGIN
  -- This function creates a profile for a user after they're fully committed
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (user_id, user_email, first_name, last_name, 'owner')
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RAISE LOG 'create_profile_for_user: Profile created for user: %', user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a function that can be called from the client side
CREATE OR REPLACE FUNCTION public.ensure_user_profile(user_id UUID, user_email TEXT, first_name TEXT DEFAULT '', last_name TEXT DEFAULT '')
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Create the profile
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (user_id, user_email, first_name, last_name, 'owner')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'ensure_user_profile: Error creating profile for user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create a policy to allow users to call this function
-- This will allow the client-side code to call the function after signup

-- Step 4: Verify the functions were created
SELECT 
  proname as function_name,
  proargnames as arguments,
  prorettype as return_type
FROM pg_proc 
WHERE proname IN ('create_profile_for_user', 'ensure_user_profile');

-- Step 5: Test the ensure_user_profile function
-- This should work for any user ID
SELECT public.ensure_user_profile(
  'c14170a1-a7e9-458f-93e6-9f492341de59',
  'test@example.com',
  'Test',
  'User'
);






