-- Fix store_settings table to match code expectations
-- Code uses 'key' column but DB has 'setting_key'
-- Code expects setting_value as text but DB has Json

-- First, drop the existing store_settings table and recreate with correct schema
DROP TABLE IF EXISTS store_settings CASCADE;

CREATE TABLE store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage store settings"
  ON store_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Store settings are viewable by everyone"
  ON store_settings FOR SELECT
  USING (true);

-- Fix contact_messages table - add 'name' as generated column if first_name exists
-- The code inserts first_name, last_name but table also has 'name' column which is required
ALTER TABLE contact_messages 
ALTER COLUMN name DROP NOT NULL;

-- Make name auto-generate from first_name + last_name
CREATE OR REPLACE FUNCTION generate_contact_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NULL OR NEW.name = '' THEN
    NEW.name := COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_messages_generate_name
BEFORE INSERT ON contact_messages
FOR EACH ROW EXECUTE FUNCTION generate_contact_name();

-- Fix live_chat_messages - make sender_type have default value
ALTER TABLE live_chat_messages 
ALTER COLUMN sender_type SET DEFAULT 'customer';

-- Make sure sender column is used as sender_type if sender_type not provided
CREATE OR REPLACE FUNCTION set_sender_type_from_sender()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_type IS NULL OR NEW.sender_type = '' THEN
    NEW.sender_type := COALESCE(NEW.sender, 'customer');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER live_chat_messages_set_sender_type
BEFORE INSERT ON live_chat_messages
FOR EACH ROW EXECUTE FUNCTION set_sender_type_from_sender();

-- Fix payment_methods - ensure code column has default if not provided
ALTER TABLE payment_methods
ALTER COLUMN code SET DEFAULT 'custom';

-- Add trigger to auto-generate code from name if not provided
CREATE OR REPLACE FUNCTION generate_payment_method_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' OR NEW.code = 'custom' THEN
    NEW.code := LOWER(REPLACE(REPLACE(NEW.name, ' ', '_'), '-', '_'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_generate_code
BEFORE INSERT ON payment_methods
FOR EACH ROW EXECUTE FUNCTION generate_payment_method_code();