-- FIX CURRENT ISSUES AFTER SIGNUP SUCCESS
-- This addresses the immediate issues we've identified

-- Step 1: Create profile for the new user manually
INSERT INTO public.profiles (id, email, first_name, last_name, role)
VALUES (
  '30a70696-428a-4a8e-862c-e4f4866bf3bf',
  'test@example.com', -- Replace with actual email from signup
  'Test',
  'User',
  'owner'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Check companies RLS policies
-- The issue is likely that new users can't create companies
-- Let's create a policy that allows users to create companies

DROP POLICY IF EXISTS "Users can create companies" ON companies;
CREATE POLICY "Users can create companies" ON companies
  FOR INSERT WITH CHECK (
    -- Allow any authenticated user to create a company
    auth.uid() IS NOT NULL
  );

-- Step 3: Allow users to read their own company
DROP POLICY IF EXISTS "Users can read their company" ON companies;
CREATE POLICY "Users can read their company" ON companies
  FOR SELECT USING (
    -- Users can read companies where they are the owner
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Step 4: Allow users to update their own company
DROP POLICY IF EXISTS "Users can update their company" ON companies;
CREATE POLICY "Users can update their company" ON companies
  FOR UPDATE USING (
    -- Users can update companies where they are the owner
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Step 5: Verify the policies were created
SELECT 
  policyname,
  cmd as command,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;

-- Step 6: Test company creation with proper fields
-- This should work now with the RLS policies






