-- Add UNIQUE constraint on session_id for upsert to work
ALTER TABLE public.abandoned_carts 
ADD CONSTRAINT abandoned_carts_session_id_key UNIQUE (session_id);