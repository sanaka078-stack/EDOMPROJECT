-- Create storage buckets for the application

-- 1. Store assets bucket (for logos, favicons, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Payment logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-logos', 'payment-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Chat attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for store-assets bucket
CREATE POLICY "Public read access for store-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

CREATE POLICY "Admin can upload store-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'store-assets' AND public.has_admin_role(auth.uid()));

CREATE POLICY "Admin can update store-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'store-assets' AND public.has_admin_role(auth.uid()));

CREATE POLICY "Admin can delete store-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'store-assets' AND public.has_admin_role(auth.uid()));

-- RLS Policies for payment-logos bucket
CREATE POLICY "Public read access for payment-logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-logos');

CREATE POLICY "Admin can upload payment-logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-logos' AND public.has_admin_role(auth.uid()));

CREATE POLICY "Admin can update payment-logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-logos' AND public.has_admin_role(auth.uid()));

CREATE POLICY "Admin can delete payment-logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-logos' AND public.has_admin_role(auth.uid()));

-- RLS Policies for chat-attachments bucket
CREATE POLICY "Public read access for chat-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Authenticated users can upload chat-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own chat-attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own chat-attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);