-- ============================================
-- AQUIVIS - APPLY ENHANCED SCHEDULING SYSTEM
-- ============================================
-- Version: 1.0
-- Date: 2025-01-10
-- Purpose: Apply the enhanced scheduling system to existing database
-- 
-- This script:
-- 1. Creates the new scheduling tables
-- 2. Migrates existing custom units
-- 3. Creates helper functions
-- 4. Adds sample data for testing
-- 
-- ============================================

-- Apply the enhanced scheduling system
\i sql/ENHANCED_SCHEDULING_SYSTEM.sql

-- ============================================
-- MIGRATE EXISTING CUSTOM UNITS
-- ============================================

-- Migrate existing units with service_frequency = 'custom' to custom_schedules
INSERT INTO custom_schedules (unit_id, schedule_type, schedule_config, service_types, name, description)
SELECT 
  id as unit_id,
  'simple' as schedule_type,
  '{"frequency": "weekly", "service_types": {"weekly": ["full_service"]}, "time_preference": "09:00"}'::jsonb as schedule_config,
  '{"weekly": ["full_service"]}'::jsonb as service_types,
  'Migrated Custom Schedule' as name,
  'Automatically migrated from existing custom frequency' as description
FROM units 
WHERE service_frequency = 'custom'
  AND NOT EXISTS (
    SELECT 1 FROM custom_schedules cs 
    WHERE cs.unit_id = units.id
  );

-- ============================================
-- CREATE SAMPLE SCHEDULE TEMPLATES
-- ============================================

-- Template for Resort Daily Testing
INSERT INTO schedule_templates (company_id, template_name, template_type, template_config, applicable_property_types, applicable_unit_types, description, is_public)
VALUES (
  (SELECT id FROM companies LIMIT 1), -- Use first company for now
  'Resort Daily Testing',
  'simple',
  '{"frequency": "daily", "service_types": {"daily": ["test_only"]}, "time_preference": "09:00"}'::jsonb,
  ARRAY['resort', 'commercial'],
  ARRAY['main_pool', 'kids_pool', 'main_spa'],
  'Daily water testing for resort pools and spas',
  true
);

-- Template for Villa Weekly Service
INSERT INTO schedule_templates (company_id, template_name, template_type, template_config, applicable_property_types, applicable_unit_types, description, is_public)
VALUES (
  (SELECT id FROM companies LIMIT 1),
  'Villa Weekly Service',
  'simple',
  '{"frequency": "weekly", "service_types": {"weekly": ["full_service"]}, "time_preference": "10:00", "day_preference": "monday"}'::jsonb,
  ARRAY['resort', 'body_corporate'],
  ARRAY['villa_pool', 'plunge_pool'],
  'Weekly full service for villa pools',
  true
);

-- Template for Random Selection Testing
INSERT INTO schedule_templates (company_id, template_name, template_type, template_config, applicable_property_types, applicable_unit_types, description, is_public)
VALUES (
  (SELECT id FROM companies LIMIT 1),
  'Random Selection Testing',
  'random_selection',
  '{"frequency": "daily", "selection_count": 2, "service_types": {"daily": ["test_only"]}, "time_preference": "09:00"}'::jsonb,
  ARRAY['resort', 'commercial'],
  ARRAY['main_pool', 'kids_pool'],
  'Daily random selection testing for multiple pools',
  true
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('custom_schedules', 'property_scheduling_rules', 'schedule_templates', 'schedule_executions')
ORDER BY table_name;

-- Check migrated custom units
SELECT 
  u.name as unit_name,
  u.service_frequency,
  cs.schedule_type,
  cs.name as schedule_name
FROM units u
LEFT JOIN custom_schedules cs ON u.id = cs.unit_id
WHERE u.service_frequency = 'custom'
ORDER BY u.name;

-- Check created templates
SELECT 
  template_name,
  template_type,
  applicable_property_types,
  applicable_unit_types,
  description
FROM schedule_templates
ORDER BY template_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 'Enhanced scheduling system applied successfully!' as status;





