-- Create schedule_templates table
CREATE TABLE IF NOT EXISTS schedule_templates (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_schedule_templates_company_id ON schedule_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_active ON schedule_templates(is_active);
