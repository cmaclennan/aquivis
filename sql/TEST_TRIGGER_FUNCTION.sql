-- ============================================
-- TEST TRIGGER FUNCTION - MANUAL TEST
-- ============================================
-- Purpose: Test if the trigger function is working properly
-- Date: 2025-01-10
-- Version: 1.0
-- 
-- This will help us understand if the trigger function is the issue
-- ============================================

-- Test 1: Check if the function exists and can be called
SELECT 
  'Function Test' as test_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_new_user'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Test 2: Check if the trigger exists
SELECT 
  'Trigger Test' as test_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
      AND event_object_table = 'users'
      AND event_object_schema = 'auth'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Test 3: Check the function definition
SELECT 
  'Function Definition' as test_type,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test 4: Check if there are any other triggers on auth.users
SELECT 
  'Other Triggers' as test_type,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- Test 5: Check RLS policies on profiles table
SELECT 
  'RLS Policies' as test_type,
  policyname,
  cmd as command,
  permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test 6: Try to manually test the function (this might fail, but let's see)
-- SELECT public.handle_new_user();

-- Test 7: Check if there are any constraints on the profiles table
SELECT 
  'Constraints' as test_type,
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'profiles');








