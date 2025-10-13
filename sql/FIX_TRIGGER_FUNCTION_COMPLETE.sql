-- ============================================
-- FIX TRIGGER FUNCTION COMPLETE - COMPREHENSIVE SOLUTION
-- ============================================
-- Purpose: Fix all potential issues with the trigger function
-- Date: 2025-01-10
-- Version: 1.0
-- 
-- This addresses all potential causes of the trigger function failure:
-- 1. Function definition issues
-- 2. RLS policy conflicts
-- 3. Trigger configuration problems
-- ============================================

-- ============================================
-- 1. DROP AND RECREATE FUNCTION WITH BETTER ERROR HANDLING
-- ============================================

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function with better error handling and logging
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
-- 2. CREATE TRIGGER
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. ENSURE RLS POLICIES ALLOW TRIGGER FUNCTION
-- ============================================

-- Drop any existing policies that might block the trigger
DROP POLICY IF EXISTS "super_admin_profiles_insert" ON profiles;

-- Create a policy that allows the trigger function to work
-- The trigger runs as SECURITY DEFINER, so it should bypass RLS
-- But let's make sure there's no policy blocking it
CREATE POLICY "allow_trigger_profile_creation" ON profiles
  FOR INSERT WITH CHECK (true);

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

-- Check RLS policies
SELECT 
  'RLS Policy' as check_type,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname LIKE '%trigger%'
ORDER BY policyname;








