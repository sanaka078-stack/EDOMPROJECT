-- ==========================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ==========================================

-- product_reviews - add review_text (alias for content)
ALTER TABLE public.product_reviews 
  ADD COLUMN IF NOT EXISTS review_text TEXT;

-- coupons - add max_uses column
ALTER TABLE public.coupons 
  ADD COLUMN IF NOT EXISTS max_uses INTEGER;

-- shipping_rates - add min_days and max_days
ALTER TABLE public.shipping_rates 
  ADD COLUMN IF NOT EXISTS min_days INTEGER,
  ADD COLUMN IF NOT EXISTS max_days INTEGER;

-- contact_message_replies - add recipient_email and reply_subject
ALTER TABLE public.contact_message_replies 
  ADD COLUMN IF NOT EXISTS recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS reply_subject TEXT;

-- email_templates - add slug column
ALTER TABLE public.email_templates 
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- ==========================================
-- CREATE STORAGE BUCKET (if not exists)
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;