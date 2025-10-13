-- ============================================
-- FIX SIGNUP 500 ERROR - COMPREHENSIVE SOLUTION
-- ============================================
-- Purpose: Fix 500 error during user signup
-- Date: 2025-01-10
-- Version: 1.0
-- 
-- This script addresses all potential causes of the 500 signup error:
-- 1. Missing handle_new_user trigger function
-- 2. Missing RLS policies for profiles table
-- 3. ENUM conflicts
-- ============================================

-- ============================================
-- 1. ENSURE USER_ROLE ENUM HAS ALL VALUES
-- ============================================

-- Add super_admin to user_role ENUM if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'super_admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'super_admin';
    END IF;
END $$;

-- ============================================
-- 2. CREATE/FIX HANDLE_NEW_USER FUNCTION
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. CREATE/FIX TRIGGER
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. FIX RLS POLICIES FOR PROFILES TABLE
-- ============================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_create_own_profile" ON profiles;
DROP POLICY IF EXISTS "owner_create_team_members" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- INSERT: Users can create their OWN profile (during signup)
CREATE POLICY "users_create_own_profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- INSERT: Owners can also create profiles for team members
CREATE POLICY "owner_create_team_members" ON profiles
  FOR INSERT WITH CHECK (
    company_id = public.user_company_id() 
    AND public.is_owner()
    AND id != auth.uid() -- Don't use this policy for self
  );

-- SELECT: Users can see their own profile OR profiles in their company
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR company_id = public.user_company_id()
  );

-- UPDATE: Users can update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Check if function exists
SELECT 
  'Function exists' as status,
  proname as function_name
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check if trigger exists
SELECT 
  'Trigger exists' as status,
  trigger_name
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- Check RLS policies
SELECT 
  'RLS Policy' as status,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check ENUM values
SELECT 
  'ENUM Value' as status,
  enumlabel as value
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;








