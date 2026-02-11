-- Allow storefront (unauthenticated) clients to read their chat thread by conversation id.
-- NOTE: This makes conversations/messages readable to the public role.

-- live_chat_conversations: allow public SELECT
CREATE POLICY "Anyone can view conversations"
ON public.live_chat_conversations
FOR SELECT
USING (true);

-- live_chat_messages: allow public SELECT
CREATE POLICY "Anyone can view messages"
ON public.live_chat_messages
FOR SELECT
USING (true);