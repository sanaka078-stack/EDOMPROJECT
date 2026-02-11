-- Create login_activity table to track login history
CREATE TABLE public.login_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  login_method TEXT NOT NULL DEFAULT 'email',
  device_info JSONB,
  ip_address TEXT,
  location TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- Users can only view their own login activity
CREATE POLICY "Users can view own login activity"
  ON public.login_activity
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own login activity
CREATE POLICY "Users can insert own login activity"
  ON public.login_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_login_activity_user_id ON public.login_activity(user_id);
CREATE INDEX idx_login_activity_created_at ON public.login_activity(created_at DESC);