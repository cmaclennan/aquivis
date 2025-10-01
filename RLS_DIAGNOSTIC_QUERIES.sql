-- ============================================
-- RLS DIAGNOSTIC QUERIES
-- ============================================
-- Purpose: Understand EXACTLY what's in the database
-- Run these in Supabase SQL Editor and share results
-- ============================================

-- 1. Show ALL policies for companies table (complete details)
SELECT 
  polname as policy_name,
  polcmd as command,
  polpermissive as permissive,
  polroles::regrole[] as roles,
  pg_get_expr(polqual, polrelid) as using_clause,
  pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy 
JOIN pg_class ON pg_policy.polrelid = pg_class.oid
WHERE polrelid = 'companies'::regclass
ORDER BY polname;

-- 2. Show ALL policies for profiles table
SELECT 
  polname as policy_name,
  polcmd as command,
  pg_get_expr(polqual, polrelid) as using_clause,
  pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy 
JOIN pg_class ON pg_policy.polrelid = pg_class.oid
WHERE polrelid = 'profiles'::regclass
ORDER BY polname;

-- 3. Test if trigger exists and works
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Check current user's profile
SELECT id, email, first_name, last_name, company_id, role
FROM profiles
WHERE id = auth.uid();

-- 5. Check if user can see any companies
SELECT id, name, business_type
FROM companies
LIMIT 5;

