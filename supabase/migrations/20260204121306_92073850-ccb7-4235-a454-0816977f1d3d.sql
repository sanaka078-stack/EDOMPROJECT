-- Add is_used column to recovery_codes table
ALTER TABLE public.recovery_codes ADD COLUMN IF NOT EXISTS is_used boolean DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_is_used ON public.recovery_codes(user_id, is_used);

-- Add RLS policies for recovery_codes if not exists
DO $$
BEGIN
  -- Drop existing policies to recreate them properly
  DROP POLICY IF EXISTS "Users can view their own recovery codes" ON public.recovery_codes;
  DROP POLICY IF EXISTS "Users can insert their own recovery codes" ON public.recovery_codes;
  DROP POLICY IF EXISTS "Users can update their own recovery codes" ON public.recovery_codes;
  DROP POLICY IF EXISTS "Users can delete their own recovery codes" ON public.recovery_codes;
END$$;

-- Recreate proper RLS policies
CREATE POLICY "Users can view their own recovery codes"
  ON public.recovery_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recovery codes"
  ON public.recovery_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery codes"
  ON public.recovery_codes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recovery codes"
  ON public.recovery_codes FOR DELETE
  USING (auth.uid() = user_id);