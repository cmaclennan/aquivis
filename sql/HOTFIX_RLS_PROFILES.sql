-- ============================================
-- HOTFIX: Allow users to create their own profile during signup
-- ============================================
-- Issue: RLS blocks profile creation because company_id doesn't exist yet
-- Solution: Allow INSERT where profile.id = auth.uid() (user creating their own profile)

-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "owner_create_members" ON profiles;

-- Create new policies that allow self-registration

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

-- UPDATE: Users can update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Keep existing SELECT and owner UPDATE policies
-- (They're fine as-is)

