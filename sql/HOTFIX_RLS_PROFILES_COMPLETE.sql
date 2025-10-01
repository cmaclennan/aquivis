-- ============================================
-- COMPLETE HOTFIX: Fix ALL profile RLS policies for signup flow
-- ============================================

-- Drop ALL existing profile policies
DROP POLICY IF EXISTS "company_members" ON profiles;
DROP POLICY IF EXISTS "owner_manage_members" ON profiles;
DROP POLICY IF EXISTS "owner_create_members" ON profiles;
DROP POLICY IF EXISTS "users_create_own_profile" ON profiles;
DROP POLICY IF EXISTS "owner_create_team_members" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

-- ============================================
-- NEW POLICIES (Complete and Correct)
-- ============================================

-- SELECT: Users can see their own profile OR company members
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid() -- Can always see own profile
    OR 
    company_id = public.user_company_id() -- Can see company members
  );

-- INSERT: Users can create their own profile during signup
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (
    id = auth.uid() -- Only allow creating own profile
  );

-- INSERT: Owners can invite team members
CREATE POLICY "profiles_insert_team" ON profiles
  FOR INSERT WITH CHECK (
    id != auth.uid() -- Not their own profile
    AND company_id = public.user_company_id() -- Same company
    AND public.is_owner() -- Must be owner
  );

-- UPDATE: Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (
    id = auth.uid() -- Can only update own profile
  );

-- UPDATE: Owners can update team member profiles
CREATE POLICY "profiles_update_team" ON profiles
  FOR UPDATE USING (
    id != auth.uid() -- Not their own
    AND company_id = public.user_company_id() -- Same company
    AND public.is_owner() -- Must be owner
  );

-- DELETE: Only owners can delete team members (not themselves)
CREATE POLICY "profiles_delete_team" ON profiles
  FOR DELETE USING (
    id != auth.uid()
    AND company_id = public.user_company_id()
    AND public.is_owner()
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

