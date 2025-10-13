-- FIX GET_COMPANY_STATS FUNCTION
-- The services table doesn't have an updated_at column, causing the function to fail

-- Drop and recreate the function with the correct column references
DROP FUNCTION IF EXISTS public.get_company_stats(UUID);

CREATE OR REPLACE FUNCTION public.get_company_stats(company_uuid UUID)
RETURNS TABLE (
  company_name TEXT,
  user_count BIGINT,
  property_count BIGINT,
  unit_count BIGINT,
  service_count BIGINT,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name as company_name,
    COUNT(DISTINCT p.id) as user_count,
    COUNT(DISTINCT pr.id) as property_count,
    COUNT(DISTINCT u.id) as unit_count,
    COUNT(DISTINCT s.id) as service_count,
    GREATEST(
      MAX(p.updated_at),
      MAX(pr.updated_at),
      MAX(u.updated_at),
      MAX(s.created_at)  -- Use created_at instead of updated_at for services
    ) as last_activity
  FROM companies c
  LEFT JOIN profiles p ON p.company_id = c.id
  LEFT JOIN properties pr ON pr.company_id = c.id
  LEFT JOIN units u ON u.property_id = pr.id
  LEFT JOIN services s ON s.unit_id = u.id
  WHERE c.id = company_uuid
  GROUP BY c.id, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was created
SELECT 
  proname as function_name,
  proargnames as arguments,
  prorettype as return_type
FROM pg_proc 
WHERE proname = 'get_company_stats';






