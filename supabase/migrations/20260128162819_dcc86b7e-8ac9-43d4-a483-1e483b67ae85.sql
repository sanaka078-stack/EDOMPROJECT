-- Fix RLS policies: Change from RESTRICTIVE to PERMISSIVE

-- Drop existing restrictive policies for products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

-- Create permissive policies for products
CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));

CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (true);

-- Drop existing restrictive policies for categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;

-- Create permissive policies for categories
CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));

CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
TO authenticated
USING (true);

-- Drop existing restrictive policies for coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

-- Create permissive policies for coupons
CREATE POLICY "Admins can manage coupons" 
ON public.coupons 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));

CREATE POLICY "Anyone can view active coupons" 
ON public.coupons 
FOR SELECT 
TO authenticated
USING ((is_active = true) AND ((end_date IS NULL) OR (end_date > now())));

-- Drop existing restrictive policies for auto_discount_rules
DROP POLICY IF EXISTS "Admins can manage auto discount rules" ON public.auto_discount_rules;
DROP POLICY IF EXISTS "Anyone can view active rules" ON public.auto_discount_rules;

-- Create permissive policies for auto_discount_rules
CREATE POLICY "Admins can manage auto discount rules" 
ON public.auto_discount_rules 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));

CREATE POLICY "Anyone can view active rules" 
ON public.auto_discount_rules 
FOR SELECT 
TO authenticated
USING (is_active = true);