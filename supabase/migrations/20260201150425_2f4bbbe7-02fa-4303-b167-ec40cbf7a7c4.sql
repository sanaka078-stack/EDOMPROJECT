-- Create table for blocked/pending login attempts
CREATE TABLE public.blocked_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  device_info JSONB,
  ip_address TEXT,
  verification_token TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
  verified_at TIMESTAMP WITH TIME ZONE,
  blocked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own blocked attempts
CREATE POLICY "Users can view own blocked attempts"
ON public.blocked_login_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow insert for service role (edge function)
CREATE POLICY "Service can insert blocked attempts"
ON public.blocked_login_attempts
FOR INSERT
WITH CHECK (true);

-- Policy: Allow update for verification
CREATE POLICY "Users can verify own attempts"
ON public.blocked_login_attempts
FOR UPDATE
USING (auth.uid() = user_id OR verification_token IS NOT NULL);

-- Add index for faster lookups
CREATE INDEX idx_blocked_login_verification_token ON public.blocked_login_attempts(verification_token);
CREATE INDEX idx_blocked_login_user_id ON public.blocked_login_attempts(user_id);
CREATE INDEX idx_blocked_login_expires_at ON public.blocked_login_attempts(expires_at);

-- Add column to user_sessions for tracking trusted devices
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT false;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;