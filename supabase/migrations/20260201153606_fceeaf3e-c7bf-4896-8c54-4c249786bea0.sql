-- Create failed_login_attempts table to track login failures
CREATE TABLE public.failed_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  user_id UUID,
  ip_address TEXT,
  device_info JSONB,
  failure_reason TEXT,
  attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create account_lockouts table to track locked accounts
CREATE TABLE public.account_lockouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  lock_reason TEXT,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  unlocked_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_failed_login_attempts_email ON public.failed_login_attempts(email);
CREATE INDEX idx_failed_login_attempts_time ON public.failed_login_attempts(attempt_time);
CREATE INDEX idx_account_lockouts_email ON public.account_lockouts(email);
CREATE INDEX idx_account_lockouts_locked_until ON public.account_lockouts(locked_until);

-- Enable RLS
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for failed_login_attempts
CREATE POLICY "Admins can view all failed attempts"
ON public.failed_login_attempts
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Service role can insert failed attempts"
ON public.failed_login_attempts
FOR INSERT
WITH CHECK (true);

-- RLS policies for account_lockouts  
CREATE POLICY "Admins can manage account lockouts"
ON public.account_lockouts
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can check lockout status"
ON public.account_lockouts
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage lockouts"
ON public.account_lockouts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update lockouts"
ON public.account_lockouts
FOR UPDATE
USING (true);

-- Function to check and lock account after failed attempts
CREATE OR REPLACE FUNCTION public.check_account_lockout(
  p_email TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_lockout_duration_minutes INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_failures INTEGER;
  v_lockout_record RECORD;
  v_result JSONB;
BEGIN
  -- Check if account is already locked
  SELECT * INTO v_lockout_record
  FROM account_lockouts
  WHERE email = p_email
    AND locked_until > now()
    AND unlocked_at IS NULL;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'locked', true,
      'locked_until', v_lockout_record.locked_until,
      'failed_attempts', v_lockout_record.failed_attempts,
      'reason', v_lockout_record.lock_reason
    );
  END IF;
  
  -- Count recent failed attempts (last 30 minutes)
  SELECT COUNT(*) INTO v_recent_failures
  FROM failed_login_attempts
  WHERE email = p_email
    AND attempt_time > (now() - interval '30 minutes');
  
  RETURN jsonb_build_object(
    'locked', false,
    'failed_attempts', v_recent_failures,
    'max_attempts', p_max_attempts,
    'remaining_attempts', GREATEST(0, p_max_attempts - v_recent_failures)
  );
END;
$$;

-- Function to record failed attempt and lock if needed
CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL,
  p_failure_reason TEXT DEFAULT 'Invalid credentials',
  p_max_attempts INTEGER DEFAULT 5,
  p_lockout_duration_minutes INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_failures INTEGER;
  v_should_lock BOOLEAN;
  v_lockout_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Insert the failed attempt
  INSERT INTO failed_login_attempts (email, user_id, ip_address, device_info, failure_reason)
  VALUES (p_email, p_user_id, p_ip_address, p_device_info, p_failure_reason);
  
  -- Count recent failed attempts
  SELECT COUNT(*) INTO v_recent_failures
  FROM failed_login_attempts
  WHERE email = p_email
    AND attempt_time > (now() - interval '30 minutes');
  
  -- Check if we should lock the account
  v_should_lock := v_recent_failures >= p_max_attempts;
  
  IF v_should_lock THEN
    v_lockout_until := now() + (p_lockout_duration_minutes || ' minutes')::interval;
    
    -- Insert or update lockout record
    INSERT INTO account_lockouts (email, user_id, locked_until, lock_reason, failed_attempts)
    VALUES (p_email, p_user_id, v_lockout_until, 'Too many failed login attempts', v_recent_failures)
    ON CONFLICT (email) DO UPDATE SET
      locked_at = now(),
      locked_until = v_lockout_until,
      lock_reason = 'Too many failed login attempts',
      failed_attempts = v_recent_failures,
      unlocked_at = NULL,
      unlocked_by = NULL,
      updated_at = now();
    
    RETURN jsonb_build_object(
      'locked', true,
      'locked_until', v_lockout_until,
      'failed_attempts', v_recent_failures,
      'message', 'Account locked due to too many failed attempts'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'locked', false,
    'failed_attempts', v_recent_failures,
    'remaining_attempts', p_max_attempts - v_recent_failures,
    'message', 'Failed attempt recorded'
  );
END;
$$;

-- Function to unlock account
CREATE OR REPLACE FUNCTION public.unlock_account(
  p_email TEXT,
  p_unlocked_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE account_lockouts
  SET unlocked_at = now(),
      unlocked_by = p_unlocked_by,
      updated_at = now()
  WHERE email = p_email
    AND unlocked_at IS NULL;
  
  RETURN FOUND;
END;
$$;