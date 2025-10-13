-- Create property_scheduling_rules table
CREATE TABLE IF NOT EXISTS property_scheduling_rules (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_rules_property_id ON property_scheduling_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_property_rules_active ON property_scheduling_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_property_rules_priority ON property_scheduling_rules(priority DESC);
