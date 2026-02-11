-- Add policy for customers to view their own records via user_id
CREATE POLICY "Customers can view own data"
ON public.customers
FOR SELECT
USING (auth.uid() = user_id);

-- Add policy for customers to update their own basic info
CREATE POLICY "Customers can update own data"
ON public.customers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent customers from modifying sensitive aggregated fields
  total_orders = (SELECT total_orders FROM customers WHERE id = customers.id) AND
  total_spent = (SELECT total_spent FROM customers WHERE id = customers.id) AND
  loyalty_tier = (SELECT loyalty_tier FROM customers WHERE id = customers.id)
);