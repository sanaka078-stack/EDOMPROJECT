-- Create live_chat_conversations table
CREATE TABLE public.live_chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_avatar TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  assigned_to UUID,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live_chat_messages table
CREATE TABLE public.live_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.live_chat_conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('customer', 'agent')),
  sender_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Admins can manage all conversations"
ON public.live_chat_conversations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can view their own conversations"
ON public.live_chat_conversations
FOR SELECT
USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can create conversations"
ON public.live_chat_conversations
FOR INSERT
WITH CHECK (true);

-- RLS policies for messages
CREATE POLICY "Admins can manage all messages"
ON public.live_chat_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can view their conversation messages"
ON public.live_chat_messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM live_chat_conversations 
    WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Anyone can send messages"
ON public.live_chat_messages
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_live_chat_conversations_status ON public.live_chat_conversations(status);
CREATE INDEX idx_live_chat_conversations_customer_id ON public.live_chat_conversations(customer_id);
CREATE INDEX idx_live_chat_messages_conversation_id ON public.live_chat_messages(conversation_id);
CREATE INDEX idx_live_chat_messages_created_at ON public.live_chat_messages(created_at);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;

-- Create trigger for updated_at
CREATE TRIGGER update_live_chat_conversations_updated_at
BEFORE UPDATE ON public.live_chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();