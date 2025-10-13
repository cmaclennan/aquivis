-- ============================================
-- ADD SUPER ADMIN FUNCTIONALITY
-- ============================================
-- Purpose: Add super_admin role with full audit logging and security features
-- Date: 2025-01-10
-- Version: 1.0
-- 
-- This adds comprehensive super admin access for support and troubleshooting
-- while maintaining data isolation and security for regular users.
-- ============================================

BEGIN;

-- ============================================
-- 1. UPDATE USER_ROLE ENUM
-- ============================================

-- Add super_admin role to existing ENUM
ALTER TYPE user_role ADD VALUE 'super_admin';

-- ============================================
-- 2. CREATE AUDIT LOG TABLE
-- ============================================

-- Audit log for super admin actions
CREATE TABLE IF NOT EXISTS super_admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', 'login', 'logout'
  table_name TEXT, -- Which table was accessed
  record_id UUID, -- Which record was accessed
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- Which company's data
  details JSONB, -- Additional details about the action
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS to audit log (only super admins can see it)
ALTER TABLE super_admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_audit_access" ON super_admin_audit_log
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 3. CREATE HELPER FUNCTIONS
-- ============================================

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get super admin's current target company (for company switching)
-- Note: This function will be updated after super_admin_sessions table is created
CREATE OR REPLACE FUNCTION public.super_admin_target_company()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Log super admin action
CREATE OR REPLACE FUNCTION public.log_super_admin_action(
  p_action_type TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO super_admin_audit_log (
    super_admin_id,
    action_type,
    table_name,
    record_id,
    company_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_table_name,
    p_record_id,
    p_company_id,
    p_details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$ LANGUAGE PLPGSQL SECURITY DEFINER;

-- ============================================
-- 4. CREATE SUPER ADMIN SESSIONS TABLE
-- ============================================

-- Track super admin sessions and company switching
CREATE TABLE IF NOT EXISTS super_admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE super_admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_sessions_access" ON super_admin_sessions
  FOR ALL USING (public.is_super_admin());

-- Update the super_admin_target_company function now that sessions table exists
CREATE OR REPLACE FUNCTION public.super_admin_target_company()
RETURNS UUID AS $$
  SELECT COALESCE(
    (SELECT target_company_id FROM super_admin_sessions WHERE super_admin_id = auth.uid() AND expires_at > NOW()),
    (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- 5. UPDATE RLS POLICIES FOR SUPER ADMIN ACCESS
-- ============================================

-- Companies: Super admin can see all companies
DROP POLICY IF EXISTS "super_admin_companies_access" ON companies;
CREATE POLICY "super_admin_companies_access" ON companies
  FOR ALL USING (public.is_super_admin());

-- Profiles: Super admin can see all profiles
DROP POLICY IF EXISTS "super_admin_profiles_access" ON profiles;
CREATE POLICY "super_admin_profiles_access" ON profiles
  FOR ALL USING (public.is_super_admin());

-- Customers: Super admin can see all customers
DROP POLICY IF EXISTS "super_admin_customers_access" ON customers;
CREATE POLICY "super_admin_customers_access" ON customers
  FOR ALL USING (public.is_super_admin());

-- Properties: Super admin can see all properties
DROP POLICY IF EXISTS "super_admin_properties_access" ON properties;
CREATE POLICY "super_admin_properties_access" ON properties
  FOR ALL USING (public.is_super_admin());

-- Units: Super admin can see all units
DROP POLICY IF EXISTS "super_admin_units_access" ON units;
CREATE POLICY "super_admin_units_access" ON units
  FOR ALL USING (public.is_super_admin());

-- Services: Super admin can see all services
DROP POLICY IF EXISTS "super_admin_services_access" ON services;
CREATE POLICY "super_admin_services_access" ON services
  FOR ALL USING (public.is_super_admin());

-- Water tests: Super admin can see all water tests
DROP POLICY IF EXISTS "super_admin_water_tests_access" ON water_tests;
CREATE POLICY "super_admin_water_tests_access" ON water_tests
  FOR ALL USING (public.is_super_admin());

-- Chemical additions: Super admin can see all chemical additions
DROP POLICY IF EXISTS "super_admin_chemical_additions_access" ON chemical_additions;
CREATE POLICY "super_admin_chemical_additions_access" ON chemical_additions
  FOR ALL USING (public.is_super_admin());

-- Equipment: Super admin can see all equipment
DROP POLICY IF EXISTS "super_admin_equipment_access" ON equipment;
CREATE POLICY "super_admin_equipment_access" ON equipment
  FOR ALL USING (public.is_super_admin());

-- Plant rooms: Super admin can see all plant rooms
DROP POLICY IF EXISTS "super_admin_plant_rooms_access" ON plant_rooms;
CREATE POLICY "super_admin_plant_rooms_access" ON plant_rooms
  FOR ALL USING (public.is_super_admin());

-- Bookings: Super admin can see all bookings
DROP POLICY IF EXISTS "super_admin_bookings_access" ON bookings;
CREATE POLICY "super_admin_bookings_access" ON bookings
  FOR ALL USING (public.is_super_admin());

-- Billing reports: Super admin can see all billing reports
DROP POLICY IF EXISTS "super_admin_billing_reports_access" ON billing_reports;
CREATE POLICY "super_admin_billing_reports_access" ON billing_reports
  FOR ALL USING (public.is_super_admin());

-- Time entries: Super admin can see all time entries
DROP POLICY IF EXISTS "super_admin_time_entries_access" ON time_entries;
CREATE POLICY "super_admin_time_entries_access" ON time_entries
  FOR ALL USING (public.is_super_admin());

-- Wholesale pickups: Super admin can see all wholesale pickups
DROP POLICY IF EXISTS "super_admin_wholesale_pickups_access" ON wholesale_pickups;
CREATE POLICY "super_admin_wholesale_pickups_access" ON wholesale_pickups
  FOR ALL USING (public.is_super_admin());

-- Compliance violations: Super admin can see all compliance violations
DROP POLICY IF EXISTS "super_admin_compliance_violations_access" ON compliance_violations;
CREATE POLICY "super_admin_compliance_violations_access" ON compliance_violations
  FOR ALL USING (public.is_super_admin());

-- Lab tests: Super admin can see all lab tests
DROP POLICY IF EXISTS "super_admin_lab_tests_access" ON lab_tests;
CREATE POLICY "super_admin_lab_tests_access" ON lab_tests
  FOR ALL USING (public.is_super_admin());

-- Training flags: Super admin can see all training flags
DROP POLICY IF EXISTS "super_admin_training_flags_access" ON training_flags;
CREATE POLICY "super_admin_training_flags_access" ON training_flags
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 6. CREATE TRIGGERS FOR AUDIT LOGGING
-- ============================================

-- Function to automatically log super admin actions
CREATE OR REPLACE FUNCTION public.audit_super_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if the user is a super admin
  IF public.is_super_admin() THEN
    PERFORM public.log_super_admin_action(
      TG_OP, -- INSERT, UPDATE, DELETE
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      COALESCE(NEW.company_id, OLD.company_id),
      CASE 
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        ELSE to_jsonb(NEW)
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE PLPGSQL SECURITY DEFINER;

-- Add triggers to key tables for audit logging
DROP TRIGGER IF EXISTS audit_companies_super_admin ON companies;
CREATE TRIGGER audit_companies_super_admin
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION public.audit_super_admin_action();

DROP TRIGGER IF EXISTS audit_profiles_super_admin ON profiles;
CREATE TRIGGER audit_profiles_super_admin
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_super_admin_action();

DROP TRIGGER IF EXISTS audit_customers_super_admin ON customers;
CREATE TRIGGER audit_customers_super_admin
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION public.audit_super_admin_action();

DROP TRIGGER IF EXISTS audit_properties_super_admin ON properties;
CREATE TRIGGER audit_properties_super_admin
  AFTER INSERT OR UPDATE OR DELETE ON properties
  FOR EACH ROW EXECUTE FUNCTION public.audit_super_admin_action();

DROP TRIGGER IF EXISTS audit_services_super_admin ON services;
CREATE TRIGGER audit_services_super_admin
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION public.audit_super_admin_action();

-- ============================================
-- 7. CREATE SUPER ADMIN UTILITY FUNCTIONS
-- ============================================

-- Get all companies for super admin
CREATE OR REPLACE FUNCTION public.get_all_companies()
RETURNS TABLE (
  id UUID,
  name TEXT,
  business_type business_type,
  email TEXT,
  created_at TIMESTAMPTZ,
  user_count BIGINT
) AS $$
BEGIN
  -- Only super admins can use this function
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;
  
  -- Log the action
  PERFORM public.log_super_admin_action('view', 'companies', NULL, NULL, '{"function": "get_all_companies"}');
  
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.business_type,
    c.email,
    c.created_at,
    (SELECT COUNT(*) FROM profiles p WHERE p.company_id = c.id) as user_count
  FROM companies c
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE PLPGSQL SECURITY DEFINER;

-- Get company statistics for super admin
CREATE OR REPLACE FUNCTION public.get_company_stats(company_uuid UUID)
RETURNS TABLE (
  company_name TEXT,
  user_count BIGINT,
  property_count BIGINT,
  unit_count BIGINT,
  service_count BIGINT,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  -- Only super admins can use this function
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;
  
  -- Log the action
  PERFORM public.log_super_admin_action('view', 'companies', company_uuid, company_uuid, '{"function": "get_company_stats"}');
  
  RETURN QUERY
  SELECT 
    c.name,
    (SELECT COUNT(*) FROM profiles p WHERE p.company_id = company_uuid),
    (SELECT COUNT(*) FROM properties pr WHERE pr.company_id = company_uuid),
    (SELECT COUNT(*) FROM units u JOIN properties pr ON u.property_id = pr.id WHERE pr.company_id = company_uuid),
    (SELECT COUNT(*) FROM services s JOIN units u ON s.unit_id = u.id JOIN properties pr ON u.property_id = pr.id WHERE pr.company_id = company_uuid),
    (SELECT MAX(created_at) FROM services s JOIN units u ON s.unit_id = u.id JOIN properties pr ON u.property_id = pr.id WHERE pr.company_id = company_uuid)
  FROM companies c
  WHERE c.id = company_uuid;
END;
$$ LANGUAGE PLPGSQL SECURITY DEFINER;

-- ============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_super_admin_audit_log_super_admin_id ON super_admin_audit_log(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_audit_log_company_id ON super_admin_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_audit_log_created_at ON super_admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_super_admin_audit_log_action_type ON super_admin_audit_log(action_type);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_super_admin_sessions_super_admin_id ON super_admin_sessions(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_sessions_expires_at ON super_admin_sessions(expires_at);

-- ============================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE super_admin_audit_log IS 'Audit log for all super admin actions - tracks access, modifications, and system usage';
COMMENT ON TABLE super_admin_sessions IS 'Active super admin sessions for company switching functionality';
COMMENT ON FUNCTION public.is_super_admin() IS 'Check if current user has super admin privileges';
COMMENT ON FUNCTION public.log_super_admin_action(TEXT, TEXT, UUID, UUID, JSONB) IS 'Log super admin actions for audit trail';
COMMENT ON FUNCTION public.get_all_companies() IS 'Super admin function to get all companies with user counts';
COMMENT ON FUNCTION public.get_company_stats(UUID) IS 'Super admin function to get detailed company statistics';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify the ENUM was updated
SELECT unnest(enum_range(NULL::user_role)) as available_roles;

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('super_admin_audit_log', 'super_admin_sessions');

-- Verify functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_super_admin', 'log_super_admin_action', 'get_all_companies', 'get_company_stats');

-- Verify policies were created
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE policyname LIKE '%super_admin%'
ORDER BY tablename, policyname;
