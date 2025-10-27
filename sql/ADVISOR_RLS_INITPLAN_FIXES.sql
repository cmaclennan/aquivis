-- Advisor RLS initplan fixes: replace per-row auth.* calls with SELECT wrappers
-- This avoids re-evaluating auth.* for each row in policy predicates

BEGIN;

-- profiles: users_update_own_profile
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = (select auth.uid()));

-- profiles: profiles_select_policy (retain original company check)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    id = (select auth.uid()) OR company_id = public.user_company_id()
  );

-- companies: select/insert/update/delete (wrap auth.uid())
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
CREATE POLICY "companies_select_policy" ON public.companies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = (select auth.uid())
  )
  OR (
    (select auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.company_id IS NULL
    )
  )
);

DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
CREATE POLICY "companies_insert_policy" ON public.companies
FOR INSERT
WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
CREATE POLICY "companies_update_policy" ON public.companies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = (select auth.uid())
    AND profiles.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = (select auth.uid())
    AND profiles.role = 'owner'
  )
);

DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;
CREATE POLICY "companies_delete_policy" ON public.companies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = (select auth.uid())
    AND profiles.role = 'owner'
  )
);

-- services policies: wrap technician check
DROP POLICY IF EXISTS "service_access" ON services;
CREATE POLICY "service_access" ON services
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE company_id = public.user_company_id()
    )
    AND (public.is_owner() OR technician_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "service_update" ON services;
CREATE POLICY "service_update" ON services
  FOR UPDATE USING (
    property_id IN (
      SELECT id FROM properties WHERE company_id = public.user_company_id()
    )
    AND (public.is_owner() OR technician_id = (select auth.uid()))
  );

-- compliance reference policies (read-only)
DROP POLICY IF EXISTS "public_read_jurisdictions" ON compliance_jurisdictions;
CREATE POLICY "public_read_jurisdictions" ON compliance_jurisdictions
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "public_read_requirements" ON compliance_requirements;
CREATE POLICY "public_read_requirements" ON compliance_requirements
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "public_read_chemical_reference" ON chemical_reference;
CREATE POLICY "public_read_chemical_reference" ON chemical_reference
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- super_admin_sessions policies
DROP POLICY IF EXISTS "Super admins can view own sessions" ON super_admin_sessions;
CREATE POLICY "Super admins can view own sessions"
  ON super_admin_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can create own sessions" ON super_admin_sessions;
CREATE POLICY "Super admins can create own sessions"
  ON super_admin_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can update own sessions" ON super_admin_sessions;
CREATE POLICY "Super admins can update own sessions"
  ON super_admin_sessions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- rate limiting tables
DROP POLICY IF EXISTS "Super admins can view all login attempts" ON login_attempts;
CREATE POLICY "Super admins can view all login attempts"
  ON login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can view all lockouts" ON account_lockouts;
CREATE POLICY "Super admins can view all lockouts"
  ON account_lockouts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can update lockouts" ON account_lockouts;
CREATE POLICY "Super admins can update lockouts"
  ON account_lockouts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- equipment_failures policies
DROP POLICY IF EXISTS "Users can view equipment failures in their company" ON equipment_failures;
CREATE POLICY "Users can view equipment failures in their company"
  ON equipment_failures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM equipment e
      INNER JOIN properties p ON (e.property_id = p.id OR e.unit_id IN (SELECT id FROM units WHERE property_id = p.id))
      WHERE e.id = equipment_failures.equipment_id
      AND p.company_id = (SELECT company_id FROM profiles WHERE id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can insert equipment failures in their company" ON equipment_failures;
CREATE POLICY "Users can insert equipment failures in their company"
  ON equipment_failures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM equipment e
      INNER JOIN properties p ON (e.property_id = p.id OR e.unit_id IN (SELECT id FROM units WHERE property_id = p.id))
      WHERE e.id = equipment_failures.equipment_id
      AND p.company_id = (SELECT company_id FROM profiles WHERE id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update equipment failures in their company" ON equipment_failures;
CREATE POLICY "Users can update equipment failures in their company"
  ON equipment_failures
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM equipment e
      INNER JOIN properties p ON (e.property_id = p.id OR e.unit_id IN (SELECT id FROM units WHERE property_id = p.id))
      WHERE e.id = equipment_failures.equipment_id
      AND p.company_id = (SELECT company_id FROM profiles WHERE id = (select auth.uid()))
    )
  );

COMMIT;
