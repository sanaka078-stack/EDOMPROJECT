-- Add UPDATE policy for abandoned carts (needed for upsert operations)
CREATE POLICY "Anyone can update abandoned carts by session"
ON public.abandoned_carts
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add SELECT policy for tracking purposes (needed to read before upsert)
CREATE POLICY "Anyone can read abandoned carts"
ON public.abandoned_carts
FOR SELECT
USING (true);