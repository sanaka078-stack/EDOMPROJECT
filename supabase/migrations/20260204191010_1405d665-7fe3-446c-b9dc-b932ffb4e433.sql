-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can read abandoned carts" ON public.abandoned_carts;

-- Admins can read all abandoned carts (using existing has_admin_role function)
CREATE POLICY "Admins can view all abandoned carts"
ON public.abandoned_carts
FOR SELECT
TO authenticated
USING (has_admin_role(auth.uid()));