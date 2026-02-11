-- Add bank_accounts column for bank transfer payment method
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS bank_accounts TEXT;

-- Add unique constraint on method_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_methods_method_id_key') THEN
        ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_method_id_key UNIQUE (method_id);
    END IF;
END $$;