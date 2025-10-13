-- ============================================
-- VERIFY SUPER ADMIN FUNCTIONALITY
-- ============================================
-- Purpose: Verify that super admin functionality was installed correctly
-- Date: 2025-01-10
-- Version: 1.0
-- 
-- Run this after both Step 1 and Step 2 are completed
-- ============================================

-- Verify the ENUM was updated
SELECT 'ENUM Values:' as check_type, unnest(enum_range(NULL::user_role)) as result;

-- Verify tables were created
SELECT 'Tables Created:' as check_type, table_name as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('super_admin_audit_log', 'super_admin_sessions');

-- Verify functions were created
SELECT 'Functions Created:' as check_type, routine_name as result
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_super_admin', 'log_super_admin_action', 'get_all_companies', 'get_company_stats');

-- Verify policies were created
SELECT 'Policies Created:' as check_type, 
       tablename || '.' || policyname as result
FROM pg_policies 
WHERE policyname LIKE '%super_admin%'
ORDER BY tablename, policyname;

-- Verify triggers were created
SELECT 'Triggers Created:' as check_type, 
       event_object_table || '.' || trigger_name as result
FROM information_schema.triggers 
WHERE trigger_name LIKE '%super_admin%'
ORDER BY event_object_table, trigger_name;

-- Test is_super_admin function (should return false for non-super-admin)
SELECT 'Function Test:' as check_type, 
       public.is_super_admin() as result;








