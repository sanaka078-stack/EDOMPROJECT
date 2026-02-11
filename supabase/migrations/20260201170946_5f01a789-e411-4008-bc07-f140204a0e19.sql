-- Create storage bucket for payment method logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-logos', 'payment-logos', true);

-- Create policy to allow admins to upload payment logos
CREATE POLICY "Admins can upload payment logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-logos' 
  AND public.is_admin(auth.uid())
);

-- Create policy to allow admins to update payment logos
CREATE POLICY "Admins can update payment logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'payment-logos' 
  AND public.is_admin(auth.uid())
);

-- Create policy to allow admins to delete payment logos
CREATE POLICY "Admins can delete payment logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'payment-logos' 
  AND public.is_admin(auth.uid())
);

-- Allow public read access to payment logos
CREATE POLICY "Public can view payment logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-logos');

-- Add logo_url column to payment_methods table
ALTER TABLE public.payment_methods
ADD COLUMN logo_url TEXT;