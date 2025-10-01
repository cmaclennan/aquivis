# Manual Migration Instructions

## Apply this SQL in Supabase SQL Editor:

```sql
-- Add has_individual_units column to properties
ALTER TABLE properties
ADD COLUMN has_individual_units BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN properties.has_individual_units IS 
  'TRUE if property has individual units (villas, condos, hotel rooms with private pools/spas). FALSE for shared facilities only.';

-- Update existing properties based on property type (safe defaults)
UPDATE properties
SET has_individual_units = true
WHERE property_type = 'body_corporate';

UPDATE properties
SET has_individual_units = false
WHERE property_type IN ('resort', 'commercial', 'residential');
```

## Steps:
1. Go to Supabase Dashboard → SQL Editor
2. Paste the SQL above
3. Click "Run"
4. Reply "Done" when complete

Then I'll continue with the UI updates.

