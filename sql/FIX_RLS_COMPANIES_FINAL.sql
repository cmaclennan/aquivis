-- ============================================================================
-- FINAL RLS FIX FOR COMPANIES TABLE
-- ============================================================================
-- Issue: 403 Forbidden when user without company_id tries to SELECT/INSERT companies
-- Root Cause: RLS policies too restrictive for onboarding flow
-- Solution: Allow authenticated users without company_id to see/create companies
-- ============================================================================

BEGIN;

-- Drop all existing policies on companies table
DROP POLICY IF EXISTS "companies_select_member" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_auth" ON public.companies;
DROP POLICY IF EXISTS "companies_update_owner" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_owner" ON public.companies;

-- ============================================================================
-- SELECT Policy: Allow company members OR users without a company (onboarding)
-- ============================================================================
CREATE POLICY "companies_select_policy" ON public.companies
FOR SELECT
USING (
  -- User is a member of this company
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = auth.uid()
  )
  OR
  -- User is authenticated but has NO company yet (onboarding state)
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id IS NULL
    )
  )
);

-- ============================================================================
-- INSERT Policy: Allow ANY authenticated user to create a company
-- ============================================================================
CREATE POLICY "companies_insert_policy" ON public.companies
FOR INSERT
WITH CHECK (
  -- Any authenticated user can create a company
  auth.uid() IS NOT NULL
);

-- ============================================================================
-- UPDATE Policy: Only owners can update their company
-- ============================================================================
CREATE POLICY "companies_update_policy" ON public.companies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = auth.uid()
    AND profiles.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = auth.uid()
    AND profiles.role = 'owner'
  )
);

-- ============================================================================
-- DELETE Policy: Only owners can delete their company
-- ============================================================================
CREATE POLICY "companies_delete_policy" ON public.companies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = auth.uid()
    AND profiles.role = 'owner'
  )
);

COMMIT;

-- ============================================================================
-- Verification Query (run separately to verify)
-- ============================================================================
-- SELECT 
--     policyname,
--     cmd,
--     qual as "USING clause"
-- FROM pg_policies
-- WHERE tablename = 'companies'
-- ORDER BY policyname;

