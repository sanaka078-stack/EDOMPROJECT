-- Add QR code URL column to payment_methods table
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS qr_code_url text DEFAULT NULL;