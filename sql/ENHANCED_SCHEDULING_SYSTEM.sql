-- ============================================
-- AQUIVIS - ENHANCED SCHEDULING SYSTEM
-- ============================================
-- Version: 1.0
-- Date: 2025-01-10
-- Purpose: Comprehensive scheduling system for complex pool service requirements
-- 
-- This extends the existing schema to support:
-- - Custom unit-level schedules
-- - Property-level scheduling rules
-- - Complex multi-service schedules
-- - Random selection scheduling
-- - Day-specific scheduling
-- 
-- ============================================

-- ============================================
-- CUSTOM SCHEDULES (Unit-Level)
-- ============================================

-- Custom schedules for individual units
CREATE TABLE custom_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  
  -- Schedule configuration
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('simple', 'complex', 'random_selection')),
  schedule_config JSONB NOT NULL, -- Flexible JSON configuration
  
  -- Service type mapping
  service_types JSONB NOT NULL, -- Map frequency to service types
  
  -- Metadata
  name TEXT, -- Optional name for the schedule
  description TEXT, -- Optional description
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one active schedule per unit
  UNIQUE(unit_id) WHERE is_active = true
);

-- ============================================
-- PROPERTY SCHEDULING RULES (Property-Level)
-- ============================================

-- Property-level scheduling rules for complex scenarios
CREATE TABLE property_scheduling_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Rule configuration
  rule_name TEXT NOT NULL, -- "Sheraton Freshwater Daily", "Sea Temple Villa Weekly"
  rule_type TEXT NOT NULL CHECK (rule_type IN ('unit_specific', 'random_selection', 'group_based', 'water_type_based')),
  rule_config JSONB NOT NULL, -- Flexible configuration
  
  -- Targeting criteria
  target_units JSONB, -- Specific unit IDs this applies to
  target_water_types TEXT[], -- ['freshwater'], ['saltwater'], etc.
  target_unit_types TEXT[], -- ['main_pool'], ['villa_pool'], etc.
  target_unit_numbers TEXT[], -- ['Pool 1', 'Pool 2'], etc.
  
  -- Priority (higher number = higher priority)
  priority INTEGER DEFAULT 1,
  
  -- Metadata
  description TEXT, -- Optional description
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCHEDULE TEMPLATES (Reusable Patterns)
-- ============================================

-- Reusable schedule templates for common patterns
CREATE TABLE schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Template configuration
  template_name TEXT NOT NULL, -- "Resort Daily Test", "Villa Weekly Service"
  template_type TEXT NOT NULL CHECK (template_type IN ('simple', 'complex', 'random_selection')),
  template_config JSONB NOT NULL, -- Template configuration
  
  -- Applicability
  applicable_property_types TEXT[], -- ['resort', 'body_corporate']
  applicable_unit_types TEXT[], -- ['main_pool', 'villa_pool']
  applicable_water_types TEXT[], -- ['saltwater', 'freshwater']
  
  -- Metadata
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Can other companies use this template
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCHEDULE EXECUTION LOG (Audit Trail)
-- ============================================

-- Log of schedule executions for audit and debugging
CREATE TABLE schedule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  
  -- Execution details
  execution_date DATE NOT NULL,
  schedule_source TEXT NOT NULL, -- 'basic_frequency', 'custom_schedule', 'property_rule', 'template'
  schedule_source_id UUID, -- ID of the source schedule/rule/template
  
  -- Generated tasks
  generated_tasks JSONB NOT NULL, -- Array of tasks that were generated
  
  -- Execution status
  status TEXT NOT NULL CHECK (status IN ('generated', 'executed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Custom schedules indexes
CREATE INDEX idx_custom_schedules_unit_id ON custom_schedules(unit_id);
CREATE INDEX idx_custom_schedules_active ON custom_schedules(is_active) WHERE is_active = true;

-- Property scheduling rules indexes
CREATE INDEX idx_property_rules_property_id ON property_scheduling_rules(property_id);
CREATE INDEX idx_property_rules_active ON property_scheduling_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_property_rules_priority ON property_scheduling_rules(priority DESC);

-- Schedule templates indexes
CREATE INDEX idx_schedule_templates_company_id ON schedule_templates(company_id);
CREATE INDEX idx_schedule_templates_active ON schedule_templates(is_active) WHERE is_active = true;

-- Schedule executions indexes
CREATE INDEX idx_schedule_executions_date ON schedule_executions(execution_date);
CREATE INDEX idx_schedule_executions_property_id ON schedule_executions(property_id);
CREATE INDEX idx_schedule_executions_unit_id ON schedule_executions(unit_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get active custom schedule for a unit
CREATE OR REPLACE FUNCTION get_unit_custom_schedule(unit_uuid UUID)
RETURNS TABLE (
  id UUID,
  schedule_type TEXT,
  schedule_config JSONB,
  service_types JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.schedule_type,
    cs.schedule_config,
    cs.service_types
  FROM custom_schedules cs
  WHERE cs.unit_id = unit_uuid 
    AND cs.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get property scheduling rules
CREATE OR REPLACE FUNCTION get_property_scheduling_rules(property_uuid UUID)
RETURNS TABLE (
  id UUID,
  rule_name TEXT,
  rule_type TEXT,
  rule_config JSONB,
  target_units JSONB,
  target_water_types TEXT[],
  target_unit_types TEXT[],
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    psr.id,
    psr.rule_name,
    psr.rule_type,
    psr.rule_config,
    psr.target_units,
    psr.target_water_types,
    psr.target_unit_types,
    psr.priority
  FROM property_scheduling_rules psr
  WHERE psr.property_id = property_uuid 
    AND psr.is_active = true
  ORDER BY psr.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Sample custom schedule for Sheraton Freshwater Pool
-- INSERT INTO custom_schedules (unit_id, schedule_type, schedule_config, service_types, name, description)
-- VALUES (
--   'unit-uuid-here',
--   'simple',
--   '{"frequency": "daily", "time_preference": "09:00", "service_types": {"daily": ["test_only"]}}',
--   '{"daily": ["test_only"]}',
--   'Sheraton Freshwater Daily Test',
--   'Daily water testing for freshwater pool as per contract requirements'
-- );

-- Sample property rule for Sheraton Random Saltwater Selection
-- INSERT INTO property_scheduling_rules (property_id, rule_name, rule_type, rule_config, target_water_types, priority, description)
-- VALUES (
--   'property-uuid-here',
--   'Sheraton Random Saltwater Selection',
--   'random_selection',
--   '{"frequency": "daily", "selection_count": 2, "service_types": {"daily": ["test_only"]}, "time_preference": "09:00"}',
--   ARRAY['saltwater'],
--   10,
--   'Test 2 random saltwater pools daily as per contract requirements'
-- );

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- 1. Existing units with service_frequency = 'custom' should be migrated to custom_schedules
-- 2. The existing schedule generation logic should be updated to check these new tables
-- 3. The UI should be updated to show schedule builder when 'custom' is selected
-- 4. Property-level rules should be accessible from property management pages

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================

-- DROP TABLE IF EXISTS schedule_executions;
-- DROP TABLE IF EXISTS schedule_templates;
-- DROP TABLE IF EXISTS property_scheduling_rules;
-- DROP TABLE IF EXISTS custom_schedules;
-- DROP FUNCTION IF EXISTS get_property_scheduling_rules(UUID);
-- DROP FUNCTION IF EXISTS get_unit_custom_schedule(UUID);





