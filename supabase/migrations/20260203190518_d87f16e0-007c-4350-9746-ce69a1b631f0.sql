-- Fix function search_path security issues
CREATE OR REPLACE FUNCTION generate_contact_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NULL OR NEW.name = '' THEN
    NEW.name := COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION set_sender_type_from_sender()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_type IS NULL OR NEW.sender_type = '' THEN
    NEW.sender_type := COALESCE(NEW.sender, 'customer');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION generate_payment_method_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' OR NEW.code = 'custom' THEN
    NEW.code := LOWER(REPLACE(REPLACE(NEW.name, ' ', '_'), '-', '_'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;