-- CREATE SUPER ADMIN FUNCTIONS
-- These functions are needed for the super admin dashboard

-- Step 1: Drop existing function if it exists and create new one
DROP FUNCTION IF EXISTS public.get_all_companies();

CREATE OR REPLACE FUNCTION public.get_all_companies()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ,
  user_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.created_at,
    COUNT(p.id) as user_count
  FROM companies c
  LEFT JOIN profiles p ON p.company_id = c.id
  GROUP BY c.id, c.name, c.email, c.phone, c.created_at
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing function if it exists and create new one
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
      MAX(s.updated_at)
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

-- Step 3: Keep existing is_super_admin function (it's used by many RLS policies)
-- The function already exists and is working, so we don't need to recreate it

-- Step 4: Create RLS policies for super admin functions
-- Allow super admins to call these functions
CREATE POLICY "super_admin_can_call_functions" ON companies
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "super_admin_can_call_profile_functions" ON profiles
  FOR SELECT USING (public.is_super_admin());

-- Step 5: Verify the functions were created
SELECT 
  proname as function_name,
  proargnames as arguments,
  prorettype as return_type
FROM pg_proc 
WHERE proname IN ('get_all_companies', 'get_company_stats')
ORDER BY proname;
