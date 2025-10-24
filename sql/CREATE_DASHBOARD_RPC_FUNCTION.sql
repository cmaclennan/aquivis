-- ============================================
-- CREATE DASHBOARD RPC FUNCTION
-- ============================================
-- Purpose: Single optimized query for dashboard data
-- Replaces 5-10 sequential queries with one RPC call
-- Expected Performance: 70-90% faster dashboard loading
-- Date: 2025-01-20

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_dashboard_summary();

-- Create optimized dashboard summary function
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_result jsonb;
  v_stats jsonb;
  v_recent_services jsonb;
BEGIN
  -- Get current user ID from auth context
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  
  -- Get user's company_id
  SELECT company_id INTO v_company_id
  FROM profiles
  WHERE id = v_user_id;
  
  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No company associated with user');
  END IF;
  
  -- Build stats object
  SELECT jsonb_build_object(
    'active_properties', COUNT(DISTINCT CASE WHEN p.is_active = true THEN p.id END),
    'total_properties', COUNT(DISTINCT p.id),
    'active_units', COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END),
    'total_units', COUNT(DISTINCT u.id),
    'today_services', COUNT(DISTINCT CASE 
      WHEN s.service_date = CURRENT_DATE THEN s.id 
    END),
    'week_services', COUNT(DISTINCT CASE 
      WHEN s.service_date >= CURRENT_DATE 
      AND s.service_date < CURRENT_DATE + INTERVAL '7 days' 
      THEN s.id 
    END),
    'total_services', COUNT(DISTINCT s.id),
    'water_quality_issues', COUNT(DISTINCT CASE 
      WHEN wt.all_parameters_ok = false 
      AND wt.test_time >= CURRENT_DATE - INTERVAL '7 days'
      THEN wt.id 
    END),
    'pending_services', COUNT(DISTINCT CASE 
      WHEN s.status = 'scheduled' THEN s.id 
    END),
    'completed_services', COUNT(DISTINCT CASE 
      WHEN s.status = 'completed' THEN s.id 
    END)
  ) INTO v_stats
  FROM properties p
  LEFT JOIN units u ON u.property_id = p.id
  LEFT JOIN services s ON s.property_id = p.id
  LEFT JOIN water_tests wt ON wt.service_id = s.id
  WHERE p.company_id = v_company_id;
  
  -- Get recent services (last 5)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'service_date', s.service_date,
      'status', s.status,
      'property_name', p.name,
      'property_address', p.address,
      'technician_name', COALESCE(NULLIF(trim(concat_ws(' ', prof.first_name, prof.last_name)), ''), prof.email),
      'created_at', s.created_at,
      'notes', s.notes,
      'water_test_ok', COALESCE(wt.all_parameters_ok, true)
    )
    ORDER BY s.created_at DESC
  ) INTO v_recent_services
  FROM services s
  INNER JOIN properties p ON p.id = s.property_id
  LEFT JOIN profiles prof ON prof.id = s.technician_id
  LEFT JOIN water_tests wt ON wt.service_id = s.id
  WHERE p.company_id = v_company_id
  ORDER BY s.created_at DESC
  LIMIT 5;
  
  -- Build final result
  v_result := jsonb_build_object(
    'stats', v_stats,
    'recent_services', COALESCE(v_recent_services, '[]'::jsonb),
    'company_id', v_company_id,
    'timestamp', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_summary() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_dashboard_summary() IS 
'Optimized dashboard summary function that returns all dashboard data in a single query. 
Returns JSON with stats and recent services. Uses auth.uid() for security.';

