-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true);

-- Storage policies for chat attachments
CREATE POLICY "Anyone can upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Admins can delete chat attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'chat-attachments' AND has_role(auth.uid(), 'admin'::app_role));

-- Add attachments column to live_chat_messages
ALTER TABLE public.live_chat_messages
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;