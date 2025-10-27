BEGIN;

-- billing_reports: merge owner + super_admin into one permissive policy
DROP POLICY IF EXISTS "billing_owner_only" ON billing_reports;
DROP POLICY IF EXISTS "super_admin_billing_reports_access" ON billing_reports;
CREATE POLICY "billing_reports_access" ON billing_reports
  FOR ALL USING (
    (company_id = public.user_company_id() AND public.is_owner())
    OR public.is_super_admin()
  );

-- water_tests: merge company access + super admin into one policy
DROP POLICY IF EXISTS "company_water_tests" ON water_tests;
DROP POLICY IF EXISTS "super_admin_water_tests_access" ON water_tests;
CREATE POLICY "water_tests_access" ON water_tests
  FOR ALL USING (
    service_id IN (
      SELECT s.id FROM services s
      JOIN properties p ON s.property_id = p.id
      WHERE p.company_id = public.user_company_id()
    )
    OR public.is_super_admin()
  );

-- wholesale_pickups: merge owner-only + super_admin into one policy
DROP POLICY IF EXISTS "wholesale_owner_only" ON wholesale_pickups;
DROP POLICY IF EXISTS "super_admin_wholesale_pickups_access" ON wholesale_pickups;
CREATE POLICY "wholesale_pickups_access" ON wholesale_pickups
  FOR ALL USING (
    (company_id = public.user_company_id() AND public.is_owner())
    OR public.is_super_admin()
  );

COMMIT;
