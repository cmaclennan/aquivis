-- ============================================
-- COMPREHENSIVE RLS FIX - All Tables for Signup/Onboarding Flow
-- ============================================
-- Issue: Multiple RLS policies too restrictive for initial signup
-- Solution: Simplify policies to work with auth flow

-- ============================================
-- COMPANIES TABLE
-- ============================================

DROP POLICY IF EXISTS "users_own_company" ON companies;
DROP POLICY IF EXISTS "companies_select_own" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update_own" ON companies;
DROP POLICY IF EXISTS "companies_delete_own" ON companies;

-- SELECT: Users can see companies they're associated with
CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND company_id IS NOT NULL)
      OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id IS NOT NULL)
    )
  );

-- INSERT: Any authenticated user can create a company
CREATE POLICY "companies_insert" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can update companies they own
CREATE POLICY "companies_update" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- DELETE: Only owners can delete
CREATE POLICY "companies_delete" ON companies
  FOR DELETE USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- SIMPLER ALTERNATIVE (Use This Instead)
-- ============================================
-- If above is still problematic, use these simpler policies:

-- Comment out the complex ones above and use these:

/*
-- Just let authenticated users do what they need during onboarding
CREATE POLICY "companies_authenticated_access" ON companies
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Then we can tighten security after onboarding is proven to work
*/

