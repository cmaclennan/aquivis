-- ============================================
-- CORRECT RLS POLICIES - Properly Designed for Complete Flow
-- ============================================
-- Purpose: RLS policies that work for BOTH signup/onboarding AND normal operation
-- Approach: Handle NULL company_id case during onboarding
-- Security: Proper multi-tenant isolation once company is created
--
-- This is the CORRECT approach, not a shortcut
-- ============================================

-- ============================================
-- HELPER FUNCTIONS (Fixed to handle NULL)
-- ============================================

-- Get user's company_id (returns NULL if user has no company yet)
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is owner of their company
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'owner'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- PROFILES TABLE
-- ============================================

DROP POLICY IF EXISTS "company_members" ON profiles;
DROP POLICY IF EXISTS "owner_manage_members" ON profiles;
DROP POLICY IF EXISTS "owner_create_members" ON profiles;
DROP POLICY IF EXISTS "users_create_own_profile" ON profiles;
DROP POLICY IF EXISTS "owner_create_team_members" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_team" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_team" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_team" ON profiles;

-- SELECT: Can see own profile OR company members
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid() -- Always see own profile
    OR 
    (company_id IS NOT NULL AND company_id = public.user_company_id()) -- See company members
  );

-- INSERT: Can create own profile (during signup)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (
    id = auth.uid() -- Can only create own profile
  );

-- UPDATE: Can update own profile (during onboarding to add company_id)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (
    id = auth.uid() -- Can update own profile
  );

-- UPDATE: Owners can update team member profiles
CREATE POLICY "profiles_update_team" ON profiles
  FOR UPDATE USING (
    id != auth.uid() -- Not own profile
    AND company_id IS NOT NULL 
    AND company_id = public.user_company_id() -- Same company
    AND public.is_owner() -- Must be owner
  );

-- ============================================
-- COMPANIES TABLE
-- ============================================

DROP POLICY IF EXISTS "users_own_company" ON companies;
DROP POLICY IF EXISTS "companies_select_own" ON companies;
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update_own" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete_own" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;
DROP POLICY IF EXISTS "companies_dev" ON companies;

-- SELECT: Can see companies where you're a member
CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() 
      AND company_id IS NOT NULL
    )
    OR 
    -- During onboarding (user has no company yet), allow SELECT to check if they need to create one
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND company_id IS NOT NULL
    )
  );

-- INSERT: Any authenticated user can create A company
CREATE POLICY "companies_insert" ON companies
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL -- Must be authenticated
  );

-- UPDATE: Only owners of the company can update
CREATE POLICY "companies_update" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'owner'
    )
  );

-- DELETE: Only owners can delete their company
CREATE POLICY "companies_delete" ON companies
  FOR DELETE USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'owner'
    )
  );

-- ============================================
-- PROPERTIES TABLE
-- ============================================

DROP POLICY IF EXISTS "company_properties" ON properties;
DROP POLICY IF EXISTS "properties_dev" ON properties;

-- SELECT: Can see properties of own company
CREATE POLICY "properties_select" ON properties
  FOR SELECT USING (
    company_id = public.user_company_id()
  );

-- INSERT: Can create properties for own company
CREATE POLICY "properties_insert" ON properties
  FOR INSERT WITH CHECK (
    company_id = public.user_company_id()
  );

-- UPDATE: Can update properties of own company
CREATE POLICY "properties_update" ON properties
  FOR UPDATE USING (
    company_id = public.user_company_id()
  );

-- DELETE: Only owners can delete properties
CREATE POLICY "properties_delete" ON properties
  FOR DELETE USING (
    company_id = public.user_company_id()
    AND public.is_owner()
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Check profiles policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;

-- Check companies policies  
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'companies' ORDER BY policyname;

-- Check properties policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'properties' ORDER BY policyname;

