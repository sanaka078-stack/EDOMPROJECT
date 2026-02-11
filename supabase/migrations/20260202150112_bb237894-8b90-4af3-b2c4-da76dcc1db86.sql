-- Add delivery days columns to shipping_rates table
ALTER TABLE public.shipping_rates
ADD COLUMN min_days integer DEFAULT 1,
ADD COLUMN max_days integer DEFAULT 3;