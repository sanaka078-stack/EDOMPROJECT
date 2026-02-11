-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('database-backups', 'database-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Create backups tracking table
CREATE TABLE IF NOT EXISTS public.database_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'scheduled')),
  file_format TEXT NOT NULL CHECK (file_format IN ('json', 'csv')),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  tables_included TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.database_backups ENABLE ROW LEVEL SECURITY;

-- Only admins can manage backups
CREATE POLICY "Admins can view all backups"
ON public.database_backups
FOR SELECT
USING (public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can create backups"
ON public.database_backups
FOR INSERT
WITH CHECK (public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can update backups"
ON public.database_backups
FOR UPDATE
USING (public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can delete backups"
ON public.database_backups
FOR DELETE
USING (public.has_admin_role(auth.uid()));

-- Storage policies for backups bucket (admin only)
CREATE POLICY "Admins can upload backups"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'database-backups' AND public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can view backups"
ON storage.objects
FOR SELECT
USING (bucket_id = 'database-backups' AND public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can delete backups"
ON storage.objects
FOR DELETE
USING (bucket_id = 'database-backups' AND public.has_admin_role(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_database_backups_created_at ON public.database_backups(created_at DESC);
CREATE INDEX idx_database_backups_status ON public.database_backups(status);