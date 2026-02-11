-- Create storage bucket for store assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for store assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload store assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-assets' 
  AND public.is_admin(auth.uid())
);

-- Allow authenticated admins to update
CREATE POLICY "Admins can update store assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-assets' 
  AND public.is_admin(auth.uid())
);

-- Allow authenticated admins to delete
CREATE POLICY "Admins can delete store assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-assets' 
  AND public.is_admin(auth.uid())
);