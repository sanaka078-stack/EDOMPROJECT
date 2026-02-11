-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notify_order_updates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_order_shipped boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_order_delivered boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_promotions boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_new_arrivals boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_price_drops boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_account_activity boolean DEFAULT true;