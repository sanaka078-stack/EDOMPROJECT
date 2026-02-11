-- Create auto discount rules table
CREATE TABLE public.auto_discount_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL DEFAULT 'cart_total',
  condition TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_triggered INTEGER NOT NULL DEFAULT 0,
  total_savings NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auto_discount_rules ENABLE ROW LEVEL SECURITY;

-- Admins can manage rules
CREATE POLICY "Admins can manage auto discount rules"
ON public.auto_discount_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));

-- Anyone can view active rules (for applying discounts)
CREATE POLICY "Anyone can view active rules"
ON public.auto_discount_rules
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_auto_discount_rules_updated_at
BEFORE UPDATE ON public.auto_discount_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();