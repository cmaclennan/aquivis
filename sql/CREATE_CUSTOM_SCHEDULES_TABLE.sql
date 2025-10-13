-- Create custom_schedules table
CREATE TABLE IF NOT EXISTS custom_schedules (
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_schedules_unit_id ON custom_schedules(unit_id);
CREATE INDEX IF NOT EXISTS idx_custom_schedules_active ON custom_schedules(is_active);
