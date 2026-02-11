-- Add missing columns to payment_methods
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_configured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS display_name_bn TEXT,
ADD COLUMN IF NOT EXISTS payment_type TEXT,
ADD COLUMN IF NOT EXISTS min_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS fee_type TEXT,
ADD COLUMN IF NOT EXISTS fee_value DECIMAL(10,2);

-- Add missing columns to live_chat_conversations
ALTER TABLE public.live_chat_conversations 
ADD COLUMN IF NOT EXISTS customer_avatar TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_notes TEXT;

-- Add missing columns to live_chat_messages
ALTER TABLE public.live_chat_messages 
ADD COLUMN IF NOT EXISTS sender TEXT;

-- Add missing columns to ip_rate_limits
ALTER TABLE public.ip_rate_limits 
ADD COLUMN IF NOT EXISTS endpoint TEXT;

-- Add missing columns to ip_rate_limit_settings  
ALTER TABLE public.ip_rate_limit_settings
ADD COLUMN IF NOT EXISTS endpoint TEXT,
ADD COLUMN IF NOT EXISTS window_seconds INTEGER DEFAULT 60;

-- Create enabled_payment_methods table
CREATE TABLE public.enabled_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    method_id TEXT NOT NULL,
    name TEXT NOT NULL,
    name_bn TEXT,
    code TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    logo_url TEXT,
    account_details JSONB,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    supports_verification BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enabled_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enabled payment methods are viewable by everyone"
ON public.enabled_payment_methods FOR SELECT
USING (true);

CREATE POLICY "Admins can manage enabled payment methods"
ON public.enabled_payment_methods FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create product_inventory table
CREATE TABLE public.product_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID,
    sku TEXT,
    quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    warehouse_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view product inventory"
ON public.product_inventory FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can manage product inventory"
ON public.product_inventory FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create inventory_history table
CREATE TABLE public.inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity_change INTEGER NOT NULL,
    reason TEXT,
    reference_type TEXT,
    reference_id UUID,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view inventory history"
ON public.inventory_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage inventory history"
ON public.inventory_history FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create product_variants table
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    options JSONB DEFAULT '{}',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product variants are viewable by everyone"
ON public.product_variants FOR SELECT
USING (true);

CREATE POLICY "Admins can manage product variants"
ON public.product_variants FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add foreign key constraint for inventory
ALTER TABLE public.product_inventory 
ADD CONSTRAINT product_inventory_variant_id_fkey 
FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Create analytics_events table
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics events"
ON public.analytics_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

-- Create daily_stats table for dashboard
CREATE TABLE public.daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view daily stats"
ON public.daily_stats FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can manage daily stats"
ON public.daily_stats FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));