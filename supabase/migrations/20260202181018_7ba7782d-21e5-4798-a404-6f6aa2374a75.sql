-- Create contact message replies history table
CREATE TABLE public.contact_message_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  replied_by UUID NOT NULL,
  reply_subject TEXT NOT NULL,
  reply_content TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;

-- Create policy for admins
CREATE POLICY "Admins can manage contact message replies"
ON public.contact_message_replies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_contact_message_replies_message_id ON public.contact_message_replies(message_id);
CREATE INDEX idx_contact_message_replies_replied_by ON public.contact_message_replies(replied_by);