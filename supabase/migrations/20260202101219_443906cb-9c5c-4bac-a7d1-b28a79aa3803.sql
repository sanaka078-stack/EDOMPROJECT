-- Add address_type column to user_addresses table
ALTER TABLE public.user_addresses 
ADD COLUMN address_type text NOT NULL DEFAULT 'shipping';

-- Add constraint to ensure valid address types
ALTER TABLE public.user_addresses
ADD CONSTRAINT valid_address_type CHECK (address_type IN ('shipping', 'billing', 'both'));

-- Create index for faster lookups by type
CREATE INDEX idx_user_addresses_type ON public.user_addresses(user_id, address_type);