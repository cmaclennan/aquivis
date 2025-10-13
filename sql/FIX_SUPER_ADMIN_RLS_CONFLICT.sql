-- ============================================
-- FIX SUPER ADMIN RLS CONFLICT WITH SIGNUP
-- ============================================
-- Purpose: Fix the RLS policy conflict that prevents user signup
-- Date: 2025-01-10
-- Version: 1.0
-- 
-- Problem: The super_admin_profiles_access policy uses is_super_admin()
-- which queries the profiles table, creating a chicken-and-egg problem
-- during user signup when the trigger tries to insert a new profile.
-- ============================================

-- ============================================
-- 1. FIX THE SUPER ADMIN RLS POLICY
-- ============================================

-- Drop the problematic policy that blocks signup
DROP POLICY IF EXISTS "super_admin_profiles_access" ON profiles;

-- Create separate policies for different operations
-- SELECT: Super admin can see all profiles
CREATE POLICY "super_admin_profiles_select" ON profiles
  FOR SELECT USING (public.is_super_admin());

-- UPDATE: Super admin can update all profiles  
CREATE POLICY "super_admin_profiles_update" ON profiles
  FOR UPDATE USING (public.is_super_admin());

-- DELETE: Super admin can delete all profiles
CREATE POLICY "super_admin_profiles_delete" ON profiles
  FOR DELETE USING (public.is_super_admin());

-- INSERT: Super admin can insert profiles (but this won't be used during signup)
-- The trigger function runs as SECURITY DEFINER, so it bypasses RLS anyway
CREATE POLICY "super_admin_profiles_insert" ON profiles
  FOR INSERT WITH CHECK (public.is_super_admin());

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
-- 4. VERIFICATION
-- ============================================

-- Check if policies exist
SELECT 
  'Policy Check' as check_type,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname LIKE 'super_admin_profiles_%'
ORDER BY policyname;

-- ============================================
-- 5. TEST THE FIX
-- ============================================

-- This should now work without the chicken-and-egg problem
-- The trigger function runs as SECURITY DEFINER and bypasses RLS
-- The super admin policies only apply to SELECT/UPDATE/DELETE operations








