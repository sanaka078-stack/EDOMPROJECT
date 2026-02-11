-- Allow customers to view their own orders (through customer_id -> customers.user_id)
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

-- Allow customers to view their own order items
CREATE POLICY "Customers can view own order items"
ON public.order_items
FOR SELECT
USING (
  order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE c.user_id = auth.uid()
  )
);