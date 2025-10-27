-- HOTFIX: Remove overly-permissive companies policies introduced by initplan fixes
-- Context: Prior migration created policies that allowed users without a company_id
-- to SELECT all rows from companies. This hotfix removes those policies.

BEGIN;

DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

-- Optionally, ensure strict select remains via existing policy defined elsewhere:
-- -- CREATE POLICY "users_own_company" ON companies FOR ALL USING (id = public.user_company_id());
-- We do not (re)create it here to avoid conflicts, assuming it exists from schema baseline.

COMMIT;
