-- Add missing columns to payment_methods
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS secret_key TEXT,
ADD COLUMN IF NOT EXISTS merchant_id TEXT,
ADD COLUMN IF NOT EXISTS extra_config JSONB;

-- Add missing columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS notify_order_updates BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_order_shipped BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_order_delivered BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_promotions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_arrivals BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_price_drops BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_account_activity BOOLEAN DEFAULT true;

-- Add is_default column to user_addresses
ALTER TABLE public.user_addresses 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Add missing columns to coupons
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS applicable_products JSONB,
ADD COLUMN IF NOT EXISTS applicable_categories JSONB,
ADD COLUMN IF NOT EXISTS user_limit INTEGER,
ADD COLUMN IF NOT EXISTS first_order_only BOOLEAN DEFAULT false;

-- Create order_tracking table
CREATE TABLE public.order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order tracking"
ON public.order_tracking FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_tracking.order_id 
        AND orders.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all order tracking"
ON public.order_tracking FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can manage order tracking"
ON public.order_tracking FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add missing columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id),
ADD COLUMN IF NOT EXISTS gift_message TEXT,
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false;