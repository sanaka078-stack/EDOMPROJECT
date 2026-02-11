-- Add separate default columns for shipping and billing
ALTER TABLE public.user_addresses 
ADD COLUMN is_default_shipping boolean NOT NULL DEFAULT false,
ADD COLUMN is_default_billing boolean NOT NULL DEFAULT false;

-- Migrate existing is_default data based on address_type
UPDATE public.user_addresses 
SET is_default_shipping = is_default 
WHERE address_type IN ('shipping', 'both');

UPDATE public.user_addresses 
SET is_default_billing = is_default 
WHERE address_type IN ('billing', 'both');

-- Drop the old trigger
DROP TRIGGER IF EXISTS ensure_single_default_address_trigger ON public.user_addresses;

-- Update the function to handle separate defaults
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle shipping default
  IF NEW.is_default_shipping = true THEN
    UPDATE public.user_addresses 
    SET is_default_shipping = false 
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default_shipping = true;
  END IF;
  
  -- Handle billing default
  IF NEW.is_default_billing = true THEN
    UPDATE public.user_addresses 
    SET is_default_billing = false 
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default_billing = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER ensure_single_default_address_trigger
BEFORE INSERT OR UPDATE ON public.user_addresses
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_address();

-- Create indexes for faster lookups
CREATE INDEX idx_user_addresses_default_shipping ON public.user_addresses(user_id, is_default_shipping) WHERE is_default_shipping = true;
CREATE INDEX idx_user_addresses_default_billing ON public.user_addresses(user_id, is_default_billing) WHERE is_default_billing = true;