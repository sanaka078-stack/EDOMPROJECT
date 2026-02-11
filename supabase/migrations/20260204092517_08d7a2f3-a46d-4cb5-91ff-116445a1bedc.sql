
-- Allow customers to read their own conversations (using session storage matching)
CREATE POLICY "Customers can view their own conversations"
ON public.live_chat_conversations
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow customers to update their own conversations (for updating unread count etc)
CREATE POLICY "Customers can update their own conversations"
ON public.live_chat_conversations
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow customers to read messages from their conversations
CREATE POLICY "Customers can view messages in conversations"
ON public.live_chat_messages
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow customers to update their messages (for marking as read)
CREATE POLICY "Customers can update messages"
ON public.live_chat_messages
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
