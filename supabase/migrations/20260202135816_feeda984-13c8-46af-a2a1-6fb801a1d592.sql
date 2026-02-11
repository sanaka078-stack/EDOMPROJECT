
-- =============================================
-- Create remaining tables that don't exist yet
-- =============================================

-- 1. user_sessions - Track user login sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  device_info JSONB,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. shipping_zones
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT,
  regions TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shipping zones" ON public.shipping_zones FOR SELECT USING (true);
CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. shipping_rates
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  min_weight NUMERIC,
  max_weight NUMERIC,
  min_order_amount NUMERIC,
  max_order_amount NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shipping rates" ON public.shipping_rates FOR SELECT USING (true);
CREATE POLICY "Admins can manage shipping rates" ON public.shipping_rates FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. recovery_codes - 2FA recovery codes
CREATE TABLE IF NOT EXISTS public.recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.recovery_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own recovery codes" ON public.recovery_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own recovery codes" ON public.recovery_codes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. login_activity
CREATE TABLE IF NOT EXISTS public.login_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  location JSONB,
  status TEXT DEFAULT 'success',
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own login activity" ON public.login_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all login activity" ON public.login_activity FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert login activity" ON public.login_activity FOR INSERT WITH CHECK (true);

-- 6. failed_login_attempts
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can check failed attempts" ON public.failed_login_attempts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert failed attempts" ON public.failed_login_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage failed attempts" ON public.failed_login_attempts FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 7. blocked_login_attempts
CREATE TABLE IF NOT EXISTS public.blocked_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  ip_address TEXT,
  reason TEXT,
  blocked_until TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.blocked_login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can check blocked attempts" ON public.blocked_login_attempts FOR SELECT USING (true);
CREATE POLICY "Admins can manage blocked attempts" ON public.blocked_login_attempts FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 8. blocked_ips
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_by UUID,
  blocked_until TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can check blocked IPs" ON public.blocked_ips FOR SELECT USING (true);
CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 9. ip_rate_limits
CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can check rate limits" ON public.ip_rate_limits FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rate limits" ON public.ip_rate_limits FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage rate limits" ON public.ip_rate_limits FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 10. ip_rate_limit_settings
CREATE TABLE IF NOT EXISTS public.ip_rate_limit_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT,
  max_requests INTEGER DEFAULT 100,
  window_seconds INTEGER DEFAULT 60,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ip_rate_limit_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rate limit settings" ON public.ip_rate_limit_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage rate limit settings" ON public.ip_rate_limit_settings FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 11. geo_blocking_rules
CREATE TABLE IF NOT EXISTS public.geo_blocking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  country_name TEXT,
  is_blocked BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.geo_blocking_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view geo blocking rules" ON public.geo_blocking_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage geo blocking rules" ON public.geo_blocking_rules FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 12. email_templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active email templates" ON public.email_templates FOR SELECT USING (is_active = true);

-- 13. auto_discount_rules
CREATE TABLE IF NOT EXISTS public.auto_discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'cart_total', 'product_quantity', 'category', etc.
  conditions JSONB NOT NULL DEFAULT '{}',
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL,
  min_purchase NUMERIC,
  max_discount NUMERIC,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.auto_discount_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active discount rules" ON public.auto_discount_rules FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage discount rules" ON public.auto_discount_rules FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add updated_at triggers for new tables
CREATE TRIGGER update_shipping_zones_updated_at BEFORE UPDATE ON public.shipping_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_rates_updated_at BEFORE UPDATE ON public.shipping_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ip_rate_limit_settings_updated_at BEFORE UPDATE ON public.ip_rate_limit_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geo_blocking_rules_updated_at BEFORE UPDATE ON public.geo_blocking_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_discount_rules_updated_at BEFORE UPDATE ON public.auto_discount_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.login_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;
