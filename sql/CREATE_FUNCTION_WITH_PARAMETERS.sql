-- ============================================
-- CREATE FUNCTION WITH PARAMETERS - PROPER APPROACH
-- ============================================
-- Purpose: Create the trigger function with proper parameter handling
-- Date: 2025-01-10
-- Version: 1.0
-- 
-- The issue is that the function needs to be created with proper parameters
-- for Supabase to recognize it in the schema cache.
-- ============================================

-- ============================================
-- 1. DROP EXISTING FUNCTION AND TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- 2. CREATE FUNCTION WITH PROPER SIGNATURE
-- ============================================

-- Create the function with explicit parameter types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
BEGIN
  -- Extract user data
  user_email := NEW.email;
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  
  -- Log the attempt
  RAISE LOG 'Creating profile for user: % (%)', user_email, NEW.id;
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    user_email,
    user_first_name,
    user_last_name,
    'owner'
  );
  
  -- Log success
  RAISE LOG 'Profile created successfully for user: %', user_email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE LOG 'Error in handle_new_user for user %: %', user_email, SQLERRM;
    -- Re-raise the error
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. CREATE TRIGGER
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. VERIFICATION
-- ============================================

-- Check if function exists
SELECT 
  'Function Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_new_user'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN '✅ CREATED'
    ELSE '❌ FAILED'
  END as status;

-- Check if trigger exists
SELECT 
  'Trigger Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
      AND event_object_table = 'users'
      AND event_object_schema = 'auth'
    ) THEN '✅ CREATED'
    ELSE '❌ FAILED'
  END as status;

-- Check function signature
SELECT 
  'Function Signature' as check_type,
  proname as function_name,
  pronargs as parameter_count,
  prorettype as return_type
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');








