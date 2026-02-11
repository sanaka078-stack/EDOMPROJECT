-- Create auto_discount_rules table
CREATE TABLE public.auto_discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL DEFAULT 'cart_total',
    conditions JSONB DEFAULT '{}',
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_purchase DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_discount_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auto discount rules are viewable by everyone"
ON public.auto_discount_rules FOR SELECT
USING (true);

CREATE POLICY "Admins can manage auto discount rules"
ON public.auto_discount_rules FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Alter contact_messages table to add missing columns
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update contact_messages to set first_name from name if null
UPDATE public.contact_messages SET first_name = name WHERE first_name IS NULL;

-- Alter blocked_ips table to add missing column
ALTER TABLE public.blocked_ips 
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id);

-- Alter login_activity table to ensure all columns exist
ALTER TABLE public.login_activity 
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Create wishlists table
CREATE TABLE public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
ON public.wishlists FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist"
ON public.wishlists FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Create admin_presence table for live chat
CREATE TABLE public.admin_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    is_online BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view admin presence"
ON public.admin_presence FOR SELECT
USING (true);

CREATE POLICY "Users can manage own presence"
ON public.admin_presence FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for admin presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_presence;