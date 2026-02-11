-- Add customer_id column to support_tickets table
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON public.support_tickets(customer_id);

-- Check user_addresses table and add is_default column if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_addresses' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_addresses' AND column_name = 'is_default' AND table_schema = 'public') THEN
      ALTER TABLE public.user_addresses ADD COLUMN is_default boolean DEFAULT false;
    END IF;
  END IF;
END $$;