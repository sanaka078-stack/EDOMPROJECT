-- Create storage bucket for payment logos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-logos', 'payment-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
CREATE POLICY "Payment logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-logos');

CREATE POLICY "Admins can upload payment logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-logos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update payment logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'payment-logos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete payment logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-logos' AND
  has_role(auth.uid(), 'admin'::app_role)
);