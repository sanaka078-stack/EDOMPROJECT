-- Add replied_at column to track when admin replied to a message
ALTER TABLE public.contact_messages 
ADD COLUMN replied_at timestamp with time zone DEFAULT NULL;

-- Add index for filtering by reply status
CREATE INDEX idx_contact_messages_replied_at ON public.contact_messages(replied_at);