-- Create abandoned_carts table to track cart sessions
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT,
  customer_name TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  abandoned_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_count INTEGER NOT NULL DEFAULT 0,
  first_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  second_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  final_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  recovered_at TIMESTAMP WITH TIME ZONE,
  recovered_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own abandoned carts
CREATE POLICY "Users can view their own abandoned carts"
ON public.abandoned_carts
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own abandoned carts
CREATE POLICY "Users can update their own abandoned carts"
ON public.abandoned_carts
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Anyone can insert abandoned carts (for guest users with session)
CREATE POLICY "Anyone can create abandoned carts"
ON public.abandoned_carts
FOR INSERT
WITH CHECK (true);

-- Policy: Admins can view all abandoned carts
CREATE POLICY "Admins can view all abandoned carts"
ON public.abandoned_carts
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Policy: Admins can update all abandoned carts (for sending reminders)
CREATE POLICY "Admins can update all abandoned carts"
ON public.abandoned_carts
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_abandoned_carts_updated_at
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for finding abandoned carts
CREATE INDEX idx_abandoned_carts_abandoned_at ON public.abandoned_carts(abandoned_at) WHERE abandoned_at IS NOT NULL AND recovered_at IS NULL;
CREATE INDEX idx_abandoned_carts_session ON public.abandoned_carts(session_id);
CREATE INDEX idx_abandoned_carts_email ON public.abandoned_carts(customer_email) WHERE customer_email IS NOT NULL;