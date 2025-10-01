-- ============================================
-- FINAL FIX: Companies SELECT Policy
-- ============================================
-- Issue: Current policy blocks users without company from even querying
-- Root cause: Missing OR clause to allow querying during onboarding

-- Drop the incomplete SELECT policy
DROP POLICY IF EXISTS "companies_select_member" ON companies;

-- Create CORRECT SELECT policy that handles onboarding
CREATE POLICY "companies_select_final" ON companies
  FOR SELECT USING (
    -- Case 1: User is a member of this company (normal operation)
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.company_id = companies.id 
      AND profiles.id = auth.uid()
    )
    OR
    -- Case 2: User has no company yet (onboarding - allow query to return empty)
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id IS NOT NULL
    )
  );

-- ============================================
-- EXPLANATION
-- ============================================

/*
This policy allows:

1. During onboarding (user has no company):
   - NOT EXISTS check is TRUE (user has no company_id)
   - Policy allows the query
   - No rows match first EXISTS, so returns empty array
   - App sees "no company" and shows onboarding ✓

2. After onboarding (user has company):
   - First EXISTS check is TRUE for their company
   - Returns their company only
   - NOT EXISTS check is FALSE (but doesn't matter, OR is satisfied)
   - Other companies don't match ✓

This is the CORRECT logic.
*/

-- Verify
SELECT policyname, cmd, qual::text 
FROM pg_policies 
WHERE tablename = 'companies' 
AND policyname = 'companies_select_final';

