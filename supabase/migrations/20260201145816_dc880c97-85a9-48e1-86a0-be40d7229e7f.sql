-- Add missing columns to products table that the app expects
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;

-- Add missing columns to shipments table
ALTER TABLE public.shipments 
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS tracking_code TEXT,
  ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Add regions column to shipping_zones (alias for districts for compatibility)
ALTER TABLE public.shipping_zones ADD COLUMN IF NOT EXISTS regions TEXT[] DEFAULT '{}';

-- Create shipping_rates table that the app expects
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  weight_from DECIMAL(10, 2) DEFAULT 0,
  weight_to DECIMAL(10, 2),
  rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shipping rates" ON public.shipping_rates FOR SELECT USING (true);
CREATE POLICY "Admins can manage shipping rates" ON public.shipping_rates FOR ALL USING (public.is_admin(auth.uid()));

-- Update store_settings to have setting_value column if it uses value
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS setting_value JSONB;

-- Create login_activity table if not exists
CREATE TABLE IF NOT EXISTS public.login_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  login_method TEXT DEFAULT 'email',
  ip_address TEXT,
  location TEXT,
  device_info JSONB,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own login activity" ON public.login_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own login activity" ON public.login_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create recovery_codes table if not exists
CREATE TABLE IF NOT EXISTS public.recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.recovery_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recovery codes" ON public.recovery_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own recovery codes" ON public.recovery_codes FOR ALL USING (auth.uid() = user_id);