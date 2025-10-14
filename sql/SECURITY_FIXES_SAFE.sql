-- ============================================
-- SAFE SECURITY FIXES (Step-by-Step)
-- ============================================
-- Purpose: Apply security fixes without deadlocks
-- Date: 2025-01-14
-- Approach: One operation at a time, with proper locking

-- ============================================
-- STEP 1: Fix Function Search Path (Safest First)
-- ============================================

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
-- STEP 2: Ensure RLS is Enabled (Safe)
-- ============================================

-- Enable RLS on all tables (safe operation)
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
-- STEP 3: Create Missing RLS Policy (Safe)
-- ============================================

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
-- STEP 4: Grant Permissions (Safe)
-- ============================================

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_total_hours() TO authenticated;
GRANT EXECUTE ON FUNCTION check_compliance_on_water_test() TO authenticated;

-- ============================================
-- END OF SAFE SECURITY FIXES
-- ============================================
