-- Allow authenticated users to create their own customer record
CREATE POLICY "Users can create their own customer record"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own customer record
CREATE POLICY "Users can update their own customer record"
ON public.customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);