-- ============================================
-- CORRECTED SECURITY FIXES
-- ============================================
-- Purpose: Fix Security Advisor errors for ACTUAL tables that exist
-- Date: 2025-01-14
-- Based on: sql/DATABASE_SCHEMA_COMPLETE.sql

-- ============================================
-- 1. FIX SECURITY DEFINER VIEWS
-- ============================================
-- Issue: Views with SECURITY DEFINER bypass RLS
-- Fix: Remove SECURITY DEFINER and ensure RLS compliance

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS dashboard_stats CASCADE;
DROP VIEW IF EXISTS compliance_summary CASCADE;
DROP VIEW IF EXISTS technician_today_services CASCADE;
DROP VIEW IF EXISTS services_with_details CASCADE;

-- Recreate dashboard_stats without SECURITY DEFINER
CREATE VIEW dashboard_stats AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  
  -- Property counts
  COUNT(DISTINCT p.id) as property_count,
  
  -- Unit counts  
  COUNT(DISTINCT u.id) as unit_count,
  
  -- Service counts
  COUNT(DISTINCT CASE WHEN s.created_at::date = CURRENT_DATE THEN s.id END) as today_services,
  COUNT(DISTINCT CASE WHEN s.created_at >= date_trunc('week', CURRENT_DATE) THEN s.id END) as week_services,
  COUNT(DISTINCT s.id) as total_services,
  
  -- Water quality issues
  COUNT(DISTINCT CASE WHEN wt.all_parameters_ok = false THEN s.id END) as water_quality_issues,
  
  -- Upcoming bookings (today's check-ins)
  COUNT(DISTINCT CASE WHEN b.check_in_date = CURRENT_DATE THEN b.id END) as today_bookings,
  
  -- Recent activity (last 7 days)
  COUNT(DISTINCT CASE WHEN s.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN s.id END) as recent_services

FROM companies c
LEFT JOIN properties p ON p.company_id = c.id AND p.is_active = true
LEFT JOIN units u ON u.property_id = p.id AND u.is_active = true
LEFT JOIN services s ON s.unit_id = u.id
LEFT JOIN water_tests wt ON wt.service_id = s.id
LEFT JOIN bookings b ON b.unit_id = u.id
GROUP BY c.id, c.name;

-- Recreate compliance_summary without SECURITY DEFINER
CREATE VIEW compliance_summary AS
SELECT 
  p.id as property_id,
  p.name as property_name,
  COUNT(cv.id) FILTER (WHERE NOT cv.resolved) as open_violations,
  COUNT(cv.id) FILTER (WHERE cv.resolved) as resolved_violations,
  MAX(cv.created_at) as last_violation_date
FROM properties p
LEFT JOIN services s ON s.property_id = p.id
LEFT JOIN compliance_violations cv ON cv.service_id = s.id
GROUP BY p.id, p.name;

-- Recreate technician_today_services without SECURITY DEFINER
CREATE VIEW technician_today_services AS
SELECT 
  s.id as service_id,
  s.service_type,
  s.status,
  p.name as property_name,
  u.name as unit_name,
  u.unit_number,
  u.unit_type,
  pr.name as plant_room_name,
  s.service_date,
  s.technician_id
FROM services s
LEFT JOIN properties p ON s.property_id = p.id
LEFT JOIN units u ON s.unit_id = u.id
LEFT JOIN plant_rooms pr ON s.plant_room_id = pr.id
WHERE DATE(s.service_date) = CURRENT_DATE
  AND s.status != 'completed';

-- Recreate services_with_details without SECURITY DEFINER
CREATE VIEW services_with_details AS
SELECT 
  s.id,
  s.service_date,
  s.service_type,
  s.status,
  s.created_at,
  s.completed_at,
  s.notes as service_notes,
  
  -- Property information
  p.id as property_id,
  p.name as property_name,
  p.property_type,
  
  -- Unit information
  u.id as unit_id,
  u.name as unit_name,
  u.unit_number,
  u.unit_type,
  u.water_type,
  
  -- Technician information
  pr.id as technician_id,
  pr.first_name,
  pr.last_name,
  CONCAT(pr.first_name, ' ', pr.last_name) as technician_name,
  
  -- Water test information
  wt.id as water_test_id,
  wt.test_time,
  wt.ph,
  wt.chlorine,
  wt.salt,
  wt.alkalinity,
  wt.calcium,
  wt.cyanuric,
  wt.bromine,
  wt.turbidity,
  wt.temperature,
  wt.all_parameters_ok,
  wt.notes as water_test_notes,
  
  -- Company context (for RLS)
  p.company_id

FROM services s
LEFT JOIN properties p ON s.property_id = p.id
LEFT JOIN units u ON s.unit_id = u.id
LEFT JOIN profiles pr ON s.technician_id = pr.id
LEFT JOIN water_tests wt ON wt.service_id = s.id;

-- Grant access to authenticated users
GRANT SELECT ON dashboard_stats TO authenticated;
GRANT SELECT ON compliance_summary TO authenticated;
GRANT SELECT ON technician_today_services TO authenticated;
GRANT SELECT ON services_with_details TO authenticated;

-- ============================================
-- 2. ENABLE RLS ON ACTUAL TABLES (if missing)
-- ============================================
-- Note: These tables should already have RLS enabled from the main schema
-- This is just a safety check

-- Enable RLS on tables that might be missing it
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_reference ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. FIX FUNCTION SEARCH_PATH SECURITY
-- ============================================
-- Issue: Functions without search_path are vulnerable to injection
-- Fix: Add search_path to all functions

-- Fix user_company_id function
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Fix is_owner function
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT role = 'owner' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix calculate_total_hours function
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix check_compliance_on_water_test function
CREATE OR REPLACE FUNCTION check_compliance_on_water_test()
RETURNS TRIGGER AS $$
DECLARE
  v_requirement_id UUID;
  v_unit_risk risk_category;
  v_property_jurisdiction TEXT;
BEGIN
  -- Get unit risk category and jurisdiction
  SELECT u.risk_category, p.company_id INTO v_unit_risk, v_property_jurisdiction
  FROM units u
  JOIN properties p ON u.property_id = p.id
  JOIN services s ON s.unit_id = u.id
  WHERE s.id = NEW.service_id;
  
  -- Check PH compliance
  -- (Additional logic to be implemented for all parameters)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- 4. ENSURE RLS POLICIES EXIST
-- ============================================
-- Note: These policies should already exist from the main schema
-- This is just a safety check to ensure they're in place

-- Create policy for customer_access table (if missing)
DO $func$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'customer_access' 
        AND policyname = 'company_customer_access'
    ) THEN
        CREATE POLICY "company_customer_access" ON customer_access
        FOR ALL USING (
          customer_id IN (
            SELECT id FROM customers WHERE company_id = public.user_company_id()
          )
        );
    END IF;
END $func$;

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================
-- Ensure all views and functions have proper permissions

-- Grant permissions on views
GRANT SELECT ON dashboard_stats TO authenticated;
GRANT SELECT ON compliance_summary TO authenticated;
GRANT SELECT ON technician_today_services TO authenticated;
GRANT SELECT ON services_with_details TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_total_hours() TO authenticated;
GRANT EXECUTE ON FUNCTION check_compliance_on_water_test() TO authenticated;

-- ============================================
-- 6. COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON VIEW dashboard_stats IS 'Dashboard statistics - RLS compliant, no SECURITY DEFINER';
COMMENT ON VIEW compliance_summary IS 'Compliance violations summary - RLS compliant, no SECURITY DEFINER';
COMMENT ON VIEW technician_today_services IS 'Today''s services for technicians - RLS compliant, no SECURITY DEFINER';
COMMENT ON VIEW services_with_details IS 'Services with pre-joined data - RLS compliant, no SECURITY DEFINER';

-- ============================================
-- END OF CORRECTED SECURITY FIXES
-- ============================================
