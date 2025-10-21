-- ============================================
-- CREATE RATE LIMITING SYSTEM
-- ============================================
-- Purpose: Prevent brute force attacks on login endpoints
-- Features: Rate limiting, account lockout, IP tracking
-- Date: 2025-01-20

-- ============================================
-- 1. LOGIN ATTEMPTS TABLE
-- ============================================
DROP TABLE IF EXISTS login_attempts CASCADE;

CREATE TABLE login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  user_agent text,
  attempt_time timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_login_attempts_email_time ON login_attempts(email, attempt_time DESC);
CREATE INDEX idx_login_attempts_ip_time ON login_attempts(ip_address, attempt_time DESC);
CREATE INDEX idx_login_attempts_success ON login_attempts(success, attempt_time DESC);

-- Enable RLS (public table, no policies needed - logged before auth)
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert (for server actions)
CREATE POLICY "Service role can insert login attempts"
  ON login_attempts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Super admins can view all attempts
CREATE POLICY "Super admins can view all login attempts"
  ON login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================
-- 2. ACCOUNT LOCKOUTS TABLE
-- ============================================
DROP TABLE IF EXISTS account_lockouts CASCADE;

CREATE TABLE account_lockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz NOT NULL,
  lock_reason text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  unlocked_at timestamptz,
  unlocked_by uuid REFERENCES auth.users(id),
  unlock_reason text
);

-- Create indexes
CREATE INDEX idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX idx_account_lockouts_locked_until ON account_lockouts(locked_until);
CREATE INDEX idx_account_lockouts_active ON account_lockouts(email, locked_until) WHERE unlocked_at IS NULL;

-- Enable RLS
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

-- Super admins can view all lockouts
CREATE POLICY "Super admins can view all lockouts"
  ON account_lockouts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super admins can update lockouts (for manual unlock)
CREATE POLICY "Super admins can update lockouts"
  ON account_lockouts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================
-- 3. FUNCTION: Log Login Attempt
-- ============================================
CREATE OR REPLACE FUNCTION log_login_attempt(
  p_email text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_success boolean DEFAULT false,
  p_failure_reason text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO login_attempts (
    email,
    ip_address,
    user_agent,
    success,
    failure_reason,
    user_id
  ) VALUES (
    p_email,
    p_ip_address,
    p_user_agent,
    p_success,
    p_failure_reason,
    p_user_id
  );
END;
$$;

-- ============================================
-- 4. FUNCTION: Check Rate Limit
-- ============================================
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_email text,
  p_ip_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email_attempts integer;
  v_ip_attempts integer;
  v_lockout_until timestamptz;
  v_is_locked boolean;
BEGIN
  -- Check if account is locked
  SELECT locked_until INTO v_lockout_until
  FROM account_lockouts
  WHERE email = p_email
    AND unlocked_at IS NULL
    AND locked_until > now()
  ORDER BY locked_at DESC
  LIMIT 1;
  
  IF v_lockout_until IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'account_locked',
      'locked_until', v_lockout_until,
      'message', 'Account is locked due to too many failed login attempts. Try again after ' || v_lockout_until::text
    );
  END IF;
  
  -- Count failed attempts by email in last 15 minutes
  SELECT COUNT(*) INTO v_email_attempts
  FROM login_attempts
  WHERE email = p_email
    AND success = false
    AND attempt_time > now() - INTERVAL '15 minutes';
  
  -- Count failed attempts by IP in last 15 minutes
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_attempts
    FROM login_attempts
    WHERE ip_address = p_ip_address
      AND success = false
      AND attempt_time > now() - INTERVAL '15 minutes';
  ELSE
    v_ip_attempts := 0;
  END IF;
  
  -- Lock account if too many attempts (5 attempts in 15 minutes)
  IF v_email_attempts >= 5 THEN
    INSERT INTO account_lockouts (
      email,
      locked_until,
      lock_reason,
      failed_attempts
    ) VALUES (
      p_email,
      now() + INTERVAL '30 minutes',
      'Too many failed login attempts',
      v_email_attempts
    )
    ON CONFLICT (email) DO UPDATE
    SET 
      locked_at = now(),
      locked_until = now() + INTERVAL '30 minutes',
      lock_reason = 'Too many failed login attempts',
      failed_attempts = v_email_attempts;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'too_many_attempts',
      'locked_until', now() + INTERVAL '30 minutes',
      'message', 'Too many failed login attempts. Account locked for 30 minutes.'
    );
  END IF;
  
  -- Check IP rate limit (10 attempts in 15 minutes)
  IF v_ip_attempts >= 10 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_rate_limit',
      'message', 'Too many login attempts from this IP address. Please try again later.'
    );
  END IF;
  
  -- Allow login
  RETURN jsonb_build_object(
    'allowed', true,
    'email_attempts', v_email_attempts,
    'ip_attempts', v_ip_attempts
  );
END;
$$;

-- ============================================
-- 5. FUNCTION: Unlock Account
-- ============================================
CREATE OR REPLACE FUNCTION unlock_account(
  p_email text,
  p_unlock_reason text DEFAULT 'Manual unlock by admin'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Verify user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_user_id
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can unlock accounts';
  END IF;
  
  UPDATE account_lockouts
  SET 
    unlocked_at = now(),
    unlocked_by = v_user_id,
    unlock_reason = p_unlock_reason
  WHERE email = p_email
    AND unlocked_at IS NULL;
END;
$$;

-- ============================================
-- 6. FUNCTION: Clean Old Login Attempts
-- ============================================
CREATE OR REPLACE FUNCTION clean_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete login attempts older than 30 days
  DELETE FROM login_attempts
  WHERE attempt_time < now() - INTERVAL '30 days';
  
  -- Delete expired lockouts older than 30 days
  DELETE FROM account_lockouts
  WHERE locked_until < now() - INTERVAL '30 days';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION log_login_attempt(text, text, text, boolean, text, uuid) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION unlock_account(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION clean_old_login_attempts() TO service_role;

-- Add comments
COMMENT ON TABLE login_attempts IS 'Tracks all login attempts for rate limiting and security auditing';
COMMENT ON TABLE account_lockouts IS 'Tracks locked accounts due to failed login attempts';
COMMENT ON FUNCTION log_login_attempt IS 'Logs a login attempt (success or failure)';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if login is allowed based on rate limiting rules';
COMMENT ON FUNCTION unlock_account IS 'Manually unlocks a locked account (super admin only)';
COMMENT ON FUNCTION clean_old_login_attempts IS 'Cleans up old login attempts and lockouts';

