-- Add COD charge fields to payment_methods table
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS cod_charge_enabled TEXT,
ADD COLUMN IF NOT EXISTS cod_charge_type TEXT,
ADD COLUMN IF NOT EXISTS cod_charge_value TEXT;