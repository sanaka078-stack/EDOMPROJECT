-- Add response time tracking columns to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_time_seconds INTEGER;

-- Add response time tracking columns to live_chat_conversations
ALTER TABLE public.live_chat_conversations 
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_time_seconds INTEGER;

-- Add first_response_at to contact_messages for tracking
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_time_seconds INTEGER;

-- Create function to calculate response time
CREATE OR REPLACE FUNCTION public.calculate_response_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_response_at IS NOT NULL AND OLD.first_response_at IS NULL THEN
    NEW.response_time_seconds := EXTRACT(EPOCH FROM (NEW.first_response_at - OLD.created_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for response time calculation
DROP TRIGGER IF EXISTS calculate_ticket_response_time ON public.support_tickets;
CREATE TRIGGER calculate_ticket_response_time
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_response_time();

DROP TRIGGER IF EXISTS calculate_chat_response_time ON public.live_chat_conversations;
CREATE TRIGGER calculate_chat_response_time
  BEFORE UPDATE ON public.live_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_response_time();

DROP TRIGGER IF EXISTS calculate_contact_response_time ON public.contact_messages;
CREATE TRIGGER calculate_contact_response_time
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_response_time();