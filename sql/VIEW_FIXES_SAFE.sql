-- ============================================
-- SAFE VIEW FIXES (Apply After Security Fixes)
-- ============================================
-- Purpose: Fix SECURITY DEFINER views without deadlocks
-- Date: 2025-01-14
-- Apply this AFTER the security fixes are complete

-- ============================================
-- STEP 1: Drop Views (One at a time to avoid deadlocks)
-- ============================================

-- Drop views one by one to avoid deadlocks
DROP VIEW IF EXISTS dashboard_stats CASCADE;
DROP VIEW IF EXISTS compliance_summary CASCADE;
DROP VIEW IF EXISTS technician_today_services CASCADE;
DROP VIEW IF EXISTS services_with_details CASCADE;

-- ============================================
-- STEP 2: Recreate Views Without SECURITY DEFINER
-- ============================================

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

-- ============================================
-- STEP 3: Grant Permissions on Views
-- ============================================

-- Grant access to authenticated users
GRANT SELECT ON dashboard_stats TO authenticated;
GRANT SELECT ON compliance_summary TO authenticated;
GRANT SELECT ON technician_today_services TO authenticated;
GRANT SELECT ON services_with_details TO authenticated;

-- ============================================
-- STEP 4: Add Comments
-- ============================================

COMMENT ON VIEW dashboard_stats IS 'Dashboard statistics - RLS compliant, no SECURITY DEFINER';
COMMENT ON VIEW compliance_summary IS 'Compliance violations summary - RLS compliant, no SECURITY DEFINER';
COMMENT ON VIEW technician_today_services IS 'Today''s services for technicians - RLS compliant, no SECURITY DEFINER';
COMMENT ON VIEW services_with_details IS 'Services with pre-joined data - RLS compliant, no SECURITY DEFINER';

-- ============================================
-- END OF SAFE VIEW FIXES
-- ============================================
