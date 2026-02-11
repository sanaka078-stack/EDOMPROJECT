-- Fix the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service can insert blocked attempts" ON public.blocked_login_attempts;

-- Create a more restrictive policy - only allow inserts via service role or authenticated users for their own attempts
CREATE POLICY "Authenticated users can insert blocked attempts"
ON public.blocked_login_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');