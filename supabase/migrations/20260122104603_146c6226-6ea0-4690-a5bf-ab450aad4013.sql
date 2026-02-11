-- Allow authenticated users to create customers (for themselves)
CREATE POLICY "Users can create own customer record"
ON public.customers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert orders
CREATE POLICY "Customers can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to insert order items for their orders
CREATE POLICY "Customers can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Allow guest checkout (unauthenticated orders) - orders without customer_id
CREATE POLICY "Allow guest orders"
ON public.orders
FOR INSERT
WITH CHECK (customer_id IS NULL);

-- Allow order items for guest orders
CREATE POLICY "Allow guest order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders WHERE customer_id IS NULL
  )
);