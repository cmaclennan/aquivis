-- FIX PROFILE POLICY CONFLICTS
-- Multiple SELECT policies are causing conflicts and 406 errors
-- The profile might not exist or policies are conflicting

-- Step 1: Check if the profile exists
SELECT id, email, company_id, role 
FROM profiles 
WHERE id = 'fe2bc5df-718d-4059-97bb-874ac9f6924f';

-- Step 2: Clean up conflicting SELECT policies
-- Keep only the essential ones and remove duplicates

-- Drop the duplicate/conflicting policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;

-- Keep only the super admin policy and create a clean user policy
-- The super admin policy should remain for admin access
-- CREATE POLICY "Users can read their own profile" ON profiles
--   FOR SELECT USING (id = auth.uid());

-- Step 3: Verify the remaining policies
SELECT 
  policyname,
  cmd as command,
  tablename
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT'
ORDER BY policyname;

-- Step 4: Test the profile read
SELECT id, email, company_id, role 
FROM profiles 
WHERE id = 'fe2bc5df-718d-4059-97bb-874ac9f6924f';






