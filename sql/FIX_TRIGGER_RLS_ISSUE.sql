-- ============================================
-- FIX TRIGGER RLS ISSUE - TARGETED SOLUTION
-- ============================================
-- Purpose: Fix the specific issue causing "Database error saving new user"
-- Date: 2025-01-10
-- Version: 1.0
-- 
-- The issue is likely that the trigger function exists but RLS policies
-- are blocking the profile creation during signup.
-- ============================================

-- ============================================
-- 1. DISABLE RLS TEMPORARILY FOR DIAGNOSIS
-- ============================================

-- First, let's temporarily disable RLS on profiles to see if that fixes it
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. ENSURE TRIGGER FUNCTION EXISTS
-- ============================================

-- Create or replace the function that auto-creates profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'owner' -- First user is always owner
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. ENSURE TRIGGER EXISTS
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. TEST THE TRIGGER (OPTIONAL)
-- ============================================

-- This will help us verify the trigger works
-- You can run this manually to test:
-- SELECT public.handle_new_user();

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Check if function exists
SELECT 
  'Function Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_new_user'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
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
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check RLS status
SELECT 
  'RLS Status' as check_type,
  CASE 
    WHEN relrowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status
FROM pg_class 
WHERE relname = 'profiles';

-- ============================================
-- 6. RE-ENABLE RLS WITH PROPER POLICIES
-- ============================================

-- After testing, re-enable RLS with proper policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_create_own_profile" ON profiles;
DROP POLICY IF EXISTS "owner_create_team_members" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- INSERT: Allow trigger function to create profiles (SECURITY DEFINER bypasses RLS)
-- But also allow users to create their own profile during signup
CREATE POLICY "allow_profile_creation" ON profiles
  FOR INSERT WITH CHECK (
    -- Allow if user is creating their own profile
    id = auth.uid()
    OR
    -- Allow if this is being called by the trigger function (SECURITY DEFINER)
    current_setting('role') = 'postgres'
  );

-- SELECT: Users can see their own profile OR profiles in their company
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR company_id = public.user_company_id()
  );

-- UPDATE: Users can update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());








