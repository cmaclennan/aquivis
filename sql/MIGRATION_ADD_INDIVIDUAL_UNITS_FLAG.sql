-- ============================================================================
-- MIGRATION: Add has_individual_units Flag to Properties
-- ============================================================================
-- Date: 2025-10-01
-- Purpose: Distinguish between properties with shared facilities vs individual units
-- Use Cases:
--   - Sheraton: has_individual_units = FALSE (9 shared pools, no private units)
--   - Sea Temple: has_individual_units = TRUE (3 shared + 90 private units)
--   - Ramada: has_individual_units = FALSE (1 shared pool)
-- ============================================================================

BEGIN;

-- Add column to properties table
ALTER TABLE properties
ADD COLUMN has_individual_units BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN properties.has_individual_units IS 
  'TRUE if property has individual units (villas, condos, hotel rooms with private pools/spas). FALSE for shared facilities only.';

-- Update existing properties based on property type (safe defaults)
-- Body corporate properties typically have individual units
UPDATE properties
SET has_individual_units = true
WHERE property_type = 'body_corporate';

-- Resort properties may have both, default to false (can be changed manually)
UPDATE properties
SET has_individual_units = false
WHERE property_type IN ('resort', 'commercial', 'residential');

COMMIT;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run after migration to verify:
-- SELECT id, name, property_type, has_individual_units FROM properties;

