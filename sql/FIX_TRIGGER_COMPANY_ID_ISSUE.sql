-- ============================================
-- FIX TRIGGER COMPANY_ID ISSUE
-- ============================================
-- Purpose: Fix potential company_id foreign key constraint issue
-- Date: 2025-01-10
-- Version: 1.0
-- 
-- The issue might be that the trigger function is trying to insert
-- a profile with company_id = NULL, but the foreign key constraint
-- might be preventing this.
-- ============================================

-- ============================================
-- 1. CHECK CURRENT CONSTRAINT
-- ============================================

-- Check if company_id has a NOT NULL constraint
SELECT 
  'Company ID Constraint' as check_type,
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'company_id';

-- ============================================
-- 2. FIX THE TRIGGER FUNCTION
-- ============================================

-- Drop and recreate the function to handle company_id properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function that doesn't set company_id (let it be NULL)
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
  
  -- Insert profile WITHOUT company_id (let it be NULL)
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
-- 3. RECREATE TRIGGER
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. ENSURE RLS POLICIES ALLOW NULL COMPANY_ID
-- ============================================

-- Update RLS policies to handle NULL company_id properly
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "super_admin_profiles_select" ON profiles;

-- Create policy that handles NULL company_id
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    id = auth.uid() 
    OR company_id = public.user_company_id()
    OR (company_id IS NULL AND id = auth.uid()) -- Allow users to see their own profile even if company_id is NULL
  );

-- Super admin can see all profiles
CREATE POLICY "super_admin_profiles_select" ON profiles
  FOR SELECT USING (public.is_super_admin());

-- ============================================
-- 5. VERIFICATION
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








