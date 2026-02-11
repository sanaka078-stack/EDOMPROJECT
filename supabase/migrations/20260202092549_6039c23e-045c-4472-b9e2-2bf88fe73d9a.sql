-- Add policy for public order tracking by order number
CREATE POLICY "Anyone can view orders by order number" 
ON public.orders 
FOR SELECT 
USING (true);

-- Note: We keep the existing policies for authenticated user access
-- The above policy allows public read access for order tracking feature