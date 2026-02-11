-- Create ip_rate_limits table to track request rates per IP
CREATE TABLE public.ip_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_request_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on IP address
CREATE UNIQUE INDEX idx_ip_rate_limits_ip ON public.ip_rate_limits(ip_address);

-- Create blocked_ips table for manual IP blocking
CREATE TABLE public.blocked_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  blocked_reason TEXT,
  blocked_by UUID,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  request_count_at_block INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create geo_blocking_rules table for country/region blocking
CREATE TABLE public.geo_blocking_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT true,
  block_reason TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(country_code)
);

-- Create ip_rate_limit_settings table for configurable limits
CREATE TABLE public.ip_rate_limit_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default rate limit settings
INSERT INTO public.ip_rate_limit_settings (setting_key, setting_value, description) VALUES
('login_rate_limit', '{"max_requests": 10, "window_minutes": 15, "block_duration_minutes": 60}', 'Rate limit for login attempts per IP'),
('api_rate_limit', '{"max_requests": 100, "window_minutes": 1, "block_duration_minutes": 15}', 'General API rate limit per IP'),
('geo_blocking_enabled', '{"enabled": false}', 'Whether geo-blocking is enabled');

-- Create indexes
CREATE INDEX idx_blocked_ips_expires ON public.blocked_ips(expires_at);
CREATE INDEX idx_geo_blocking_country ON public.geo_blocking_rules(country_code);

-- Enable RLS
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_blocking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_rate_limit_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for ip_rate_limits (service role only for writes)
CREATE POLICY "Admins can view rate limits"
ON public.ip_rate_limits
FOR SELECT
USING (is_admin(auth.uid()));

-- RLS policies for blocked_ips
CREATE POLICY "Admins can manage blocked IPs"
ON public.blocked_ips
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can check if IP is blocked"
ON public.blocked_ips
FOR SELECT
USING (true);

-- RLS policies for geo_blocking_rules
CREATE POLICY "Admins can manage geo blocking rules"
ON public.geo_blocking_rules
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view geo blocking rules"
ON public.geo_blocking_rules
FOR SELECT
USING (true);

-- RLS policies for ip_rate_limit_settings
CREATE POLICY "Admins can manage rate limit settings"
ON public.ip_rate_limit_settings
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view rate limit settings"
ON public.ip_rate_limit_settings
FOR SELECT
USING (true);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(
  p_ip_address TEXT,
  p_limit_type TEXT DEFAULT 'login_rate_limit'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings JSONB;
  v_max_requests INTEGER;
  v_window_minutes INTEGER;
  v_block_duration INTEGER;
  v_rate_limit RECORD;
  v_blocked RECORD;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_is_blocked BOOLEAN := false;
BEGIN
  -- Check if IP is manually blocked
  SELECT * INTO v_blocked
  FROM blocked_ips
  WHERE ip_address = p_ip_address
    AND (expires_at IS NULL OR expires_at > now())
    AND (is_permanent = true OR expires_at > now());
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'reason', COALESCE(v_blocked.blocked_reason, 'IP is blocked'),
      'expires_at', v_blocked.expires_at,
      'is_permanent', v_blocked.is_permanent
    );
  END IF;
  
  -- Get rate limit settings
  SELECT setting_value INTO v_settings
  FROM ip_rate_limit_settings
  WHERE setting_key = p_limit_type;
  
  IF NOT FOUND THEN
    -- Default settings
    v_max_requests := 10;
    v_window_minutes := 15;
    v_block_duration := 60;
  ELSE
    v_max_requests := (v_settings->>'max_requests')::INTEGER;
    v_window_minutes := (v_settings->>'window_minutes')::INTEGER;
    v_block_duration := (v_settings->>'block_duration_minutes')::INTEGER;
  END IF;
  
  v_window_start := now() - (v_window_minutes || ' minutes')::INTERVAL;
  
  -- Get or create rate limit record
  SELECT * INTO v_rate_limit
  FROM ip_rate_limits
  WHERE ip_address = p_ip_address;
  
  IF NOT FOUND THEN
    -- First request from this IP
    INSERT INTO ip_rate_limits (ip_address, request_count, window_start, last_request_at)
    VALUES (p_ip_address, 1, now(), now());
    
    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'request_count', 1,
      'max_requests', v_max_requests,
      'remaining', v_max_requests - 1,
      'window_minutes', v_window_minutes
    );
  END IF;
  
  -- Check if window has expired
  IF v_rate_limit.window_start < v_window_start THEN
    -- Reset the window
    UPDATE ip_rate_limits
    SET request_count = 1, window_start = now(), last_request_at = now()
    WHERE ip_address = p_ip_address;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'request_count', 1,
      'max_requests', v_max_requests,
      'remaining', v_max_requests - 1,
      'window_minutes', v_window_minutes
    );
  END IF;
  
  -- Increment request count
  UPDATE ip_rate_limits
  SET request_count = request_count + 1, last_request_at = now()
  WHERE ip_address = p_ip_address
  RETURNING * INTO v_rate_limit;
  
  -- Check if limit exceeded
  IF v_rate_limit.request_count > v_max_requests THEN
    -- Auto-block the IP
    INSERT INTO blocked_ips (ip_address, blocked_reason, expires_at, request_count_at_block)
    VALUES (
      p_ip_address, 
      'Rate limit exceeded: ' || v_rate_limit.request_count || ' requests in ' || v_window_minutes || ' minutes',
      now() + (v_block_duration || ' minutes')::INTERVAL,
      v_rate_limit.request_count
    )
    ON CONFLICT (ip_address) DO UPDATE SET
      blocked_reason = EXCLUDED.blocked_reason,
      blocked_at = now(),
      expires_at = EXCLUDED.expires_at,
      request_count_at_block = EXCLUDED.request_count_at_block;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'reason', 'Rate limit exceeded',
      'request_count', v_rate_limit.request_count,
      'max_requests', v_max_requests,
      'blocked_until', now() + (v_block_duration || ' minutes')::INTERVAL
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'blocked', false,
    'request_count', v_rate_limit.request_count,
    'max_requests', v_max_requests,
    'remaining', v_max_requests - v_rate_limit.request_count,
    'window_minutes', v_window_minutes
  );
END;
$$;

-- Function to unblock an IP
CREATE OR REPLACE FUNCTION public.unblock_ip(
  p_ip_address TEXT,
  p_unblocked_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM blocked_ips WHERE ip_address = p_ip_address;
  
  -- Reset rate limit counter
  DELETE FROM ip_rate_limits WHERE ip_address = p_ip_address;
  
  RETURN FOUND;
END;
$$;

-- Function to manually block an IP
CREATE OR REPLACE FUNCTION public.block_ip(
  p_ip_address TEXT,
  p_reason TEXT DEFAULT 'Manually blocked',
  p_blocked_by UUID DEFAULT NULL,
  p_duration_hours INTEGER DEFAULT NULL,
  p_is_permanent BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  IF p_is_permanent THEN
    v_expires_at := NULL;
  ELSIF p_duration_hours IS NOT NULL THEN
    v_expires_at := now() + (p_duration_hours || ' hours')::INTERVAL;
  ELSE
    v_expires_at := now() + interval '24 hours';
  END IF;
  
  INSERT INTO blocked_ips (ip_address, blocked_reason, blocked_by, expires_at, is_permanent)
  VALUES (p_ip_address, p_reason, p_blocked_by, v_expires_at, p_is_permanent)
  ON CONFLICT (ip_address) DO UPDATE SET
    blocked_reason = EXCLUDED.blocked_reason,
    blocked_by = EXCLUDED.blocked_by,
    blocked_at = now(),
    expires_at = EXCLUDED.expires_at,
    is_permanent = EXCLUDED.is_permanent;
  
  RETURN true;
END;
$$;