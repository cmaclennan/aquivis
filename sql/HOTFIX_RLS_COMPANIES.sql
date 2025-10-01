-- ============================================
-- HOTFIX: Allow users to create their first company
-- ============================================
-- Issue: RLS blocks company creation because user doesn't have company_id yet
-- Solution: Allow any authenticated user to INSERT companies (they'll own it)

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "users_own_company" ON companies;

-- SELECT: Users can see their own company
CREATE POLICY "companies_select_own" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- INSERT: Any authenticated user can create a company
CREATE POLICY "companies_insert" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can only update their own company
CREATE POLICY "companies_update_own" ON companies
  FOR UPDATE USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- DELETE: Only owners can delete their company
CREATE POLICY "companies_delete_own" ON companies
  FOR DELETE USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

