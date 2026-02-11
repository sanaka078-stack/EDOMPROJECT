-- Add coupon_code to orders table for tracking which coupons were used
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Create auto discount rules table for Coupons page
CREATE TABLE IF NOT EXISTS public.auto_discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL DEFAULT 'cart_total',
    condition TEXT NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_value DECIMAL(10, 2),
    max_discount DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_discount_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage auto rules" ON public.auto_discount_rules FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view active auto rules" ON public.auto_discount_rules FOR SELECT TO authenticated 
    USING (is_active = true);

CREATE TRIGGER update_auto_rules_updated_at BEFORE UPDATE ON public.auto_discount_rules 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();