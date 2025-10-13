-- ============================================
-- ADD SUPER ADMIN FUNCTIONALITY - STEP 1
-- ============================================
-- Purpose: Add super_admin role to ENUM (must be in separate transaction)
-- Date: 2025-01-10
-- Version: 1.0
-- 
-- IMPORTANT: This must be run FIRST in its own transaction
-- ============================================

-- Add super_admin role to existing ENUM
ALTER TYPE user_role ADD VALUE 'super_admin';








