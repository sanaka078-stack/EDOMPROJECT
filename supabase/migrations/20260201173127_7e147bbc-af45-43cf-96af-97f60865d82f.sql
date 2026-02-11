-- Add payment verification fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_verified_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_verified_by uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_verification_notes text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.orders.payment_verified_at IS 'Timestamp when payment was verified by admin';
COMMENT ON COLUMN public.orders.payment_verified_by IS 'Admin user ID who verified the payment';
COMMENT ON COLUMN public.orders.payment_verification_notes IS 'Notes from admin during verification';