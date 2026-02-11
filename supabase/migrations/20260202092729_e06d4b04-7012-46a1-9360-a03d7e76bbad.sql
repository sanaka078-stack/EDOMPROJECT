-- Add policy for public order items viewing (for order tracking)
CREATE POLICY "Anyone can view order items for tracking" 
ON public.order_items 
FOR SELECT 
USING (true);