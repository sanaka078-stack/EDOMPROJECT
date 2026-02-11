-- Add unique constraint on session_id for abandoned_carts upsert
ALTER TABLE public.abandoned_carts 
ADD CONSTRAINT abandoned_carts_session_id_unique UNIQUE (session_id);