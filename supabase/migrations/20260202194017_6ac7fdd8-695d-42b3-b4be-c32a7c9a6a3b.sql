-- Add tags and notes columns to live_chat_conversations
ALTER TABLE public.live_chat_conversations 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS customer_notes text DEFAULT NULL;

-- Create index for tags for better search performance
CREATE INDEX IF NOT EXISTS idx_live_chat_conversations_tags ON public.live_chat_conversations USING GIN(tags);