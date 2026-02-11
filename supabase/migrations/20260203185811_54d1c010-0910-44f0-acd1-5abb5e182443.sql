-- Add missing columns to existing tables
ALTER TABLE public.failed_login_attempts 
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.account_lockouts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.geo_blocking_rules 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.live_chat_conversations 
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Create ip_rate_limits table
CREATE TABLE public.ip_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_blocked BOOLEAN DEFAULT false,
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ip rate limits"
ON public.ip_rate_limits FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert ip rate limits"
ON public.ip_rate_limits FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update ip rate limits"
ON public.ip_rate_limits FOR UPDATE
USING (true);

-- Alter payment_methods to add missing columns
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS method_id TEXT,
ADD COLUMN IF NOT EXISTS name_bn TEXT,
ADD COLUMN IF NOT EXISTS account_details JSONB,
ADD COLUMN IF NOT EXISTS instructions_bn TEXT,
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS supports_verification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_instructions TEXT;

-- Create coupon_usage table
CREATE TABLE public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    order_id UUID REFERENCES public.orders(id),
    discount_applied DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view coupon usage"
ON public.coupon_usage FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own coupon usage"
ON public.coupon_usage FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert coupon usage"
ON public.coupon_usage FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create pathao_settings table
CREATE TABLE public.pathao_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT,
    client_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    default_store_id TEXT,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pathao_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pathao settings"
ON public.pathao_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pathao settings"
ON public.pathao_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create steadfast_settings table
CREATE TABLE public.steadfast_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key TEXT,
    secret_key TEXT,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.steadfast_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view steadfast settings"
ON public.steadfast_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage steadfast settings"
ON public.steadfast_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add foreign key to products for category
ALTER TABLE public.products 
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create auto_reply_settings table
CREATE TABLE public.auto_reply_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_enabled BOOLEAN DEFAULT false,
    message TEXT,
    delay_seconds INTEGER DEFAULT 0,
    schedule JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_reply_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view auto reply settings"
ON public.auto_reply_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage auto reply settings"
ON public.auto_reply_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));