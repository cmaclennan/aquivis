-- ============================================
-- CREATE SUPER ADMIN SESSIONS TABLE
-- ============================================
-- Purpose: Track super admin login sessions with expiry
-- Security: Automatic logout on session expiry
-- Date: 2025-01-20

-- Drop existing table if it exists
DROP TABLE IF EXISTS super_admin_sessions CASCADE;

-- Create super admin sessions table
CREATE TABLE super_admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_activity timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  logged_out_at timestamptz,
  logout_reason text
);

-- Create indexes for performance
CREATE INDEX idx_super_admin_sessions_user_id ON super_admin_sessions(user_id);
CREATE INDEX idx_super_admin_sessions_expires_at ON super_admin_sessions(expires_at);
CREATE INDEX idx_super_admin_sessions_active ON super_admin_sessions(is_active, expires_at) WHERE is_active = true;

-- Enable RLS
ALTER TABLE super_admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Super admins can view their own sessions
CREATE POLICY "Super admins can view own sessions"
  ON super_admin_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super admins can insert their own sessions
CREATE POLICY "Super admins can create own sessions"
  ON super_admin_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super admins can update their own sessions
CREATE POLICY "Super admins can update own sessions"
  ON super_admin_sessions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================
-- FUNCTION: Check and expire old sessions
-- ============================================
CREATE OR REPLACE FUNCTION expire_super_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE super_admin_sessions
  SET 
    is_active = false,
    logged_out_at = now(),
    logout_reason = 'Session expired'
  WHERE 
    is_active = true
    AND expires_at < now();
END;
$$;

-- ============================================
-- FUNCTION: Get active session for current user
-- ============================================
CREATE OR REPLACE FUNCTION get_active_super_admin_session()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  created_at timestamptz,
  expires_at timestamptz,
  last_activity timestamptz,
  time_remaining interval
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Expire old sessions first
  PERFORM expire_super_admin_sessions();
  
  -- Return active session
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.email,
    s.created_at,
    s.expires_at,
    s.last_activity,
    s.expires_at - now() as time_remaining
  FROM super_admin_sessions s
  WHERE 
    s.user_id = v_user_id
    AND s.is_active = true
    AND s.expires_at > now()
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- ============================================
-- FUNCTION: Update session activity
-- ============================================
CREATE OR REPLACE FUNCTION update_super_admin_session_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  UPDATE super_admin_sessions
  SET last_activity = now()
  WHERE 
    user_id = v_user_id
    AND is_active = true
    AND expires_at > now();
END;
$$;

-- ============================================
-- FUNCTION: Logout super admin session
-- ============================================
CREATE OR REPLACE FUNCTION logout_super_admin_session(p_reason text DEFAULT 'Manual logout')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  UPDATE super_admin_sessions
  SET 
    is_active = false,
    logged_out_at = now(),
    logout_reason = p_reason
  WHERE 
    user_id = v_user_id
    AND is_active = true;
    
  -- Log the logout action
  PERFORM log_super_admin_action(
    'logout',
    NULL,
    NULL,
    NULL,
    jsonb_build_object('reason', p_reason)
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION expire_super_admin_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_super_admin_session() TO authenticated;
GRANT EXECUTE ON FUNCTION update_super_admin_session_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION logout_super_admin_session(text) TO authenticated;

-- Add comments
COMMENT ON TABLE super_admin_sessions IS 'Tracks super admin login sessions with automatic expiry';
COMMENT ON FUNCTION expire_super_admin_sessions() IS 'Expires old super admin sessions automatically';
COMMENT ON FUNCTION get_active_super_admin_session() IS 'Returns active session for current super admin user';
COMMENT ON FUNCTION update_super_admin_session_activity() IS 'Updates last activity timestamp for current session';
COMMENT ON FUNCTION logout_super_admin_session(text) IS 'Logs out current super admin session with reason';

