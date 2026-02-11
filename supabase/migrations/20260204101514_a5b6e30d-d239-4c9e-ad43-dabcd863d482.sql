-- Add is_active column to user_sessions if not exists
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add last_activity_at column and sync with last_active_at
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- Sync existing data
UPDATE public.user_sessions 
SET last_activity_at = last_active_at
WHERE last_activity_at IS NULL AND last_active_at IS NOT NULL;

-- Drop the old last_active_at column if you want to clean up (optional)
-- We'll keep both for backwards compatibility

-- Add INSERT policy for user_sessions
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
CREATE POLICY "Users can insert their own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for user_sessions
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create login_activity insert policy for recording login attempts
DROP POLICY IF EXISTS "System can insert login activity" ON public.login_activity;
CREATE POLICY "System can insert login activity" 
ON public.login_activity 
FOR INSERT 
WITH CHECK (true);

-- Add INSERT policy for profiles if user doesn't have one
DROP POLICY IF EXISTS "Anon can insert profile on signup" ON public.profiles;
CREATE POLICY "Users can insert on signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);