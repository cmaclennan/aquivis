-- ============================================
-- DEVELOPMENT MODE RLS POLICIES (Permissive)
-- ============================================
-- Purpose: Simple policies to allow development and testing
-- Security: Still requires authentication, just less restrictive
-- Production: Will tighten these policies before launch
--
-- IMPORTANT: These are for DEVELOPMENT ONLY
-- See PRODUCTION_CHECKLIST.md for tightening before launch
-- ============================================

-- ============================================
-- COMPANIES
-- ============================================

DROP POLICY IF EXISTS "users_own_company" ON companies;
DROP POLICY IF EXISTS "companies_select_own" ON companies;
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update_own" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete_own" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;

-- Simple: Authenticated users can do anything with companies (for now)
CREATE POLICY "companies_dev" ON companies
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- PROPERTIES (and related tables)
-- ============================================

DROP POLICY IF EXISTS "company_properties" ON properties;

CREATE POLICY "properties_dev" ON properties
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NOTE: Add similar for other tables as needed
-- ============================================

-- For now, just fix companies and properties to unblock onboarding
-- We can tighten security once flow is working

-- ============================================
-- PRODUCTION TODO
-- ============================================

-- Before production launch:
-- 1. Replace these permissive policies with proper multi-tenant isolation
-- 2. Test that company A cannot see company B's data
-- 3. Test that technicians cannot see owner-only data
-- 4. See PRODUCTION_CHECKLIST.md

