-- Create shipping_zones table
CREATE TABLE public.shipping_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  regions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipping_rates table
CREATE TABLE public.shipping_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate_type TEXT NOT NULL DEFAULT 'flat', -- 'flat', 'weight', 'price'
  base_rate NUMERIC NOT NULL DEFAULT 0,
  per_kg NUMERIC,
  free_above NUMERIC,
  min_days INTEGER NOT NULL DEFAULT 1,
  max_days INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipping_zones
CREATE POLICY "Shipping zones are viewable by everyone" 
ON public.shipping_zones 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage shipping zones" 
ON public.shipping_zones 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for shipping_rates
CREATE POLICY "Shipping rates are viewable by everyone" 
ON public.shipping_rates 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage shipping rates" 
ON public.shipping_rates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_shipping_zones_updated_at
BEFORE UPDATE ON public.shipping_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_rates_updated_at
BEFORE UPDATE ON public.shipping_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default zones with rates
INSERT INTO public.shipping_zones (id, name, regions, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ঢাকা সিটি', ARRAY['ঢাকা উত্তর', 'ঢাকা দক্ষিণ'], true),
  ('22222222-2222-2222-2222-222222222222', 'চট্টগ্রাম সিটি', ARRAY['চট্টগ্রাম সিটি কর্পোরেশন'], true),
  ('33333333-3333-3333-3333-333333333333', 'সারাদেশ', ARRAY['সব বিভাগ'], true);

INSERT INTO public.shipping_rates (zone_id, name, rate_type, base_rate, per_kg, free_above, min_days, max_days) VALUES
  ('11111111-1111-1111-1111-111111111111', 'স্ট্যান্ডার্ড ডেলিভারি', 'flat', 60, NULL, NULL, 1, 2),
  ('11111111-1111-1111-1111-111111111111', 'এক্সপ্রেস ডেলিভারি', 'flat', 100, NULL, NULL, 0, 1),
  ('22222222-2222-2222-2222-222222222222', 'স্ট্যান্ডার্ড ডেলিভারি', 'flat', 80, NULL, NULL, 2, 3),
  ('22222222-2222-2222-2222-222222222222', 'এক্সপ্রেস ডেলিভারি', 'flat', 150, NULL, NULL, 1, 2),
  ('33333333-3333-3333-3333-333333333333', 'স্ট্যান্ডার্ড ডেলিভারি', 'weight', 100, 20, NULL, 3, 5),
  ('33333333-3333-3333-3333-333333333333', 'ফ্রি শিপিং (৫০০০+ টাকা)', 'flat', 0, NULL, 5000, 3, 5);