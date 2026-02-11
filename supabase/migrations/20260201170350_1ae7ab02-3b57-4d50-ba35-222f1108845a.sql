-- Create payment_methods table for storing payment configuration
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  method_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_bn TEXT,
  icon TEXT,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  is_configured BOOLEAN DEFAULT false,
  test_mode BOOLEAN DEFAULT false,
  account_number TEXT,
  account_type TEXT,
  api_key TEXT,
  secret_key TEXT,
  merchant_id TEXT,
  extra_config JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies - Admin can manage, public can read enabled methods
CREATE POLICY "Admins can manage payment methods"
  ON public.payment_methods
  FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Public can view enabled payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_enabled = true);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment methods for Bangladesh
INSERT INTO public.payment_methods (method_id, name, name_bn, icon, description, is_enabled, is_configured, display_order) VALUES
  ('bkash', 'bKash', 'বিকাশ', '💳', 'bKash mobile payment - Most popular in Bangladesh', true, false, 1),
  ('nagad', 'Nagad', 'নগদ', '📱', 'Nagad digital payment service', true, false, 2),
  ('rocket', 'Rocket', 'রকেট', '🚀', 'Dutch-Bangla Rocket mobile banking', false, false, 3),
  ('upay', 'Upay', 'উপে', '💰', 'UCB Upay mobile financial service', false, false, 4),
  ('cod', 'Cash on Delivery', 'ক্যাশ অন ডেলিভারি', '💵', 'Pay when you receive your order', true, true, 5),
  ('card', 'Card Payment', 'কার্ড পেমেন্ট', '💳', 'Visa, Mastercard, Amex via SSL', false, false, 6),
  ('sslcommerz', 'SSLCommerz', 'এসএসএল কমার্জ', '🔒', 'Complete payment gateway solution', false, false, 7),
  ('aamarpay', 'aamarPay', 'আমারপে', '🏦', 'aamarPay payment gateway', false, false, 8);