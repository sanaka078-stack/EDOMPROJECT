-- Create store_settings table for API credentials and other settings
CREATE TABLE public.store_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Only admin and super_admin can view settings
CREATE POLICY "Admins can view store settings"
ON public.store_settings
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
);

-- Only super_admin can insert settings
CREATE POLICY "Super admins can insert store settings"
ON public.store_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Admin and super_admin can update settings
CREATE POLICY "Admins can update store settings"
ON public.store_settings
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
);

-- Only super_admin can delete settings
CREATE POLICY "Super admins can delete store settings"
ON public.store_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial Steadfast credentials (will be updated by admin)
INSERT INTO public.store_settings (setting_key, setting_value, description) VALUES
('STEADFAST_API_KEY', '', 'Steadfast Courier API Key'),
('STEADFAST_SECRET_KEY', '', 'Steadfast Courier Secret Key');