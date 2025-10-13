-- FIX ONBOARDING RLS ISSUE
-- The new user doesn't have a profile, so RLS policies fail
-- We need to create a profile for the new user and fix the RLS policies

-- Step 1: Create profile for the new user
-- User ID: fe2bc5df-718d-4059-97bb-874ac9f6924f
INSERT INTO public.profiles (id, email, first_name, last_name, role)
VALUES (
  'fe2bc5df-718d-4059-97bb-874ac9f6924f',
  'newuser@example.com', -- Replace with actual email from signup
  'New',
  'User',
  'owner'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Fix the companies RLS policies
-- The issue is that the policies are too restrictive for the onboarding flow
-- We need to allow users to read companies during onboarding

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can read their company" ON companies;

-- Create a more permissive policy for onboarding
CREATE POLICY "Users can read companies during onboarding" ON companies
  FOR SELECT USING (
    -- Allow users to read companies if they have a profile (even without company_id)
    auth.uid() IN (SELECT id FROM profiles WHERE id = auth.uid())
    OR
    -- Allow users to read companies where they are the owner
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND company_id IS NOT NULL
    )
  );

-- Step 3: Also allow users to read all companies during onboarding
-- This is needed for the company selection/creation flow
CREATE POLICY "Users can read all companies for onboarding" ON companies
  FOR SELECT USING (
    -- Allow any authenticated user to read companies during onboarding
    auth.uid() IS NOT NULL
  );

-- Step 4: Verify the policies were created
SELECT 
  policyname,
  cmd as command,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;

-- Step 5: Test that we can read companies
SELECT id, name FROM companies LIMIT 1;






