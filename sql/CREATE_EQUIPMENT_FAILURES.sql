-- Create equipment failures tracking table
-- Apply this in Supabase SQL editor

-- Equipment failures table
CREATE TABLE IF NOT EXISTS equipment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Failure details
  failure_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  failure_type TEXT NOT NULL CHECK (failure_type IN ('mechanical', 'electrical', 'leak', 'performance', 'wear', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  description TEXT NOT NULL,
  
  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_date TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  
  -- Cost tracking
  parts_cost DECIMAL(10,2) DEFAULT 0,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE(parts_cost, 0) + COALESCE(labor_cost, 0)) STORED,
  
  -- Downtime tracking
  downtime_hours DECIMAL(6,2),
  
  -- Audit
  reported_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_failures_equipment 
  ON equipment_failures(equipment_id, failure_date DESC);

CREATE INDEX IF NOT EXISTS idx_equipment_failures_unresolved 
  ON equipment_failures(equipment_id) 
  WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_equipment_failures_severity 
  ON equipment_failures(severity, failure_date DESC) 
  WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_equipment_failures_service 
  ON equipment_failures(service_id) 
  WHERE service_id IS NOT NULL;

-- RLS Policies
ALTER TABLE equipment_failures ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view failures for equipment in their company
CREATE POLICY "Users can view equipment failures in their company"
  ON equipment_failures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM equipment e
      INNER JOIN properties p ON (e.property_id = p.id OR e.unit_id IN (SELECT id FROM units WHERE property_id = p.id))
      WHERE e.id = equipment_failures.equipment_id
      AND p.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Policy: Users can insert failures for equipment in their company
CREATE POLICY "Users can insert equipment failures in their company"
  ON equipment_failures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM equipment e
      INNER JOIN properties p ON (e.property_id = p.id OR e.unit_id IN (SELECT id FROM units WHERE property_id = p.id))
      WHERE e.id = equipment_failures.equipment_id
      AND p.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Policy: Users can update failures for equipment in their company
CREATE POLICY "Users can update equipment failures in their company"
  ON equipment_failures
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM equipment e
      INNER JOIN properties p ON (e.property_id = p.id OR e.unit_id IN (SELECT id FROM units WHERE property_id = p.id))
      WHERE e.id = equipment_failures.equipment_id
      AND p.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Policy: Super admins can view all failures
CREATE POLICY "Super admins can view all equipment failures"
  ON equipment_failures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Function to get equipment failure summary
CREATE OR REPLACE FUNCTION get_equipment_failure_summary(p_equipment_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_failures', COUNT(*),
    'unresolved_failures', COUNT(*) FILTER (WHERE resolved = false),
    'critical_failures', COUNT(*) FILTER (WHERE severity = 'critical'),
    'major_failures', COUNT(*) FILTER (WHERE severity = 'major'),
    'minor_failures', COUNT(*) FILTER (WHERE severity = 'minor'),
    'total_cost', COALESCE(SUM(total_cost), 0),
    'total_downtime_hours', COALESCE(SUM(downtime_hours), 0),
    'last_failure_date', MAX(failure_date),
    'mtbf_days', CASE 
      WHEN COUNT(*) > 1 THEN 
        EXTRACT(EPOCH FROM (MAX(failure_date) - MIN(failure_date))) / 86400 / (COUNT(*) - 1)
      ELSE NULL
    END
  )
  INTO v_result
  FROM equipment_failures
  WHERE equipment_id = p_equipment_id;
  
  RETURN v_result;
END;
$$;

-- Function to get recent equipment failures
CREATE OR REPLACE FUNCTION get_recent_equipment_failures(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  equipment_id UUID,
  equipment_name TEXT,
  property_name TEXT,
  failure_date TIMESTAMPTZ,
  failure_type TEXT,
  severity TEXT,
  description TEXT,
  resolved BOOLEAN,
  total_cost DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ef.id,
    ef.equipment_id,
    e.name AS equipment_name,
    p.name AS property_name,
    ef.failure_date,
    ef.failure_type,
    ef.severity,
    ef.description,
    ef.resolved,
    ef.total_cost
  FROM equipment_failures ef
  INNER JOIN equipment e ON ef.equipment_id = e.id
  INNER JOIN properties p ON (e.property_id = p.id OR e.unit_id IN (SELECT id FROM units WHERE property_id = p.id))
  WHERE p.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  ORDER BY ef.failure_date DESC
  LIMIT p_limit;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_equipment_failures_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER equipment_failures_updated_at
  BEFORE UPDATE ON equipment_failures
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_failures_updated_at();

-- Comments
COMMENT ON TABLE equipment_failures IS 'Tracks equipment failures, repairs, and associated costs';
COMMENT ON COLUMN equipment_failures.failure_type IS 'Type of failure: mechanical, electrical, leak, performance, wear, other';
COMMENT ON COLUMN equipment_failures.severity IS 'Severity: minor, major, critical';
COMMENT ON COLUMN equipment_failures.total_cost IS 'Auto-calculated total of parts_cost + labor_cost';
COMMENT ON COLUMN equipment_failures.downtime_hours IS 'Hours equipment was out of service';

