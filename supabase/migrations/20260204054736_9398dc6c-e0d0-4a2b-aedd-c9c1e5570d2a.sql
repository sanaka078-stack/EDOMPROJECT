-- Create store-assets bucket for logo and favicon uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view store assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

-- Allow authenticated users to upload store assets
CREATE POLICY "Authenticated users can upload store assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'store-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to update store assets
CREATE POLICY "Authenticated users can update store assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'store-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete store assets
CREATE POLICY "Authenticated users can delete store assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'store-assets' AND auth.role() = 'authenticated');