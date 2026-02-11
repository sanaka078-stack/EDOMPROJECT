-- Add RLS policies for customers to create and view their own tickets
CREATE POLICY "Users can view their own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

-- Users can view replies on their own tickets
CREATE POLICY "Users can view replies on their tickets" 
ON public.ticket_replies 
FOR SELECT 
USING (
  ticket_id IN (
    SELECT id FROM public.support_tickets 
    WHERE customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  )
);

-- Users can create replies on their own tickets
CREATE POLICY "Users can create replies on their tickets" 
ON public.ticket_replies 
FOR INSERT 
WITH CHECK (
  ticket_id IN (
    SELECT id FROM public.support_tickets 
    WHERE customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  )
);