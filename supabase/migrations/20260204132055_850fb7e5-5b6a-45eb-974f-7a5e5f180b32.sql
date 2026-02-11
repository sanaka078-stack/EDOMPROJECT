-- Create helper functions for schema export

-- Get all enum types
CREATE OR REPLACE FUNCTION public.get_enum_types()
RETURNS TABLE (
  typname text,
  enumlabel text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.typname::text, e.enumlabel::text
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE n.nspname = 'public'
  ORDER BY t.typname, e.enumsortorder;
$$;

-- Get all table columns
CREATE OR REPLACE FUNCTION public.get_table_columns()
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text,
  udt_name text,
  is_nullable text,
  column_default text,
  character_maximum_length integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.udt_name::text,
    c.is_nullable::text,
    c.column_default::text,
    c.character_maximum_length::integer
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position;
$$;

-- Get all table constraints
CREATE OR REPLACE FUNCTION public.get_table_constraints()
RETURNS TABLE (
  constraint_name text,
  table_name text,
  column_name text,
  constraint_type text,
  foreign_table_name text,
  foreign_column_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tc.constraint_name::text,
    tc.table_name::text,
    kcu.column_name::text,
    tc.constraint_type::text,
    ccu.table_name::text AS foreign_table_name,
    ccu.column_name::text AS foreign_column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
  LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name 
    AND tc.constraint_type = 'FOREIGN KEY'
  WHERE tc.table_schema = 'public'
  ORDER BY tc.table_name, tc.constraint_type;
$$;

-- Get all indexes
CREATE OR REPLACE FUNCTION public.get_table_indexes()
RETURNS TABLE (
  tablename text,
  indexname text,
  indexdef text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tablename::text,
    indexname::text,
    indexdef::text
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
$$;

-- Get all RLS policies
CREATE OR REPLACE FUNCTION public.get_rls_policies()
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    schemaname::text,
    tablename::text,
    policyname::text,
    permissive::text,
    roles::text[],
    cmd::text,
    qual::text,
    with_check::text
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
$$;

-- Get all database functions in public schema
CREATE OR REPLACE FUNCTION public.get_db_functions()
RETURNS TABLE (
  routine_name text,
  routine_definition text,
  data_type text,
  routine_type text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    routine_name::text,
    routine_definition::text,
    data_type::text,
    routine_type::text
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name NOT IN ('get_enum_types', 'get_table_columns', 'get_table_constraints', 'get_table_indexes', 'get_rls_policies', 'get_db_functions', 'get_db_triggers', 'has_role')
  ORDER BY routine_name;
$$;

-- Get all triggers
CREATE OR REPLACE FUNCTION public.get_db_triggers()
RETURNS TABLE (
  trigger_name text,
  event_manipulation text,
  event_object_table text,
  action_statement text,
  action_timing text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    trigger_name::text,
    event_manipulation::text,
    event_object_table::text,
    action_statement::text,
    action_timing::text
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  ORDER BY event_object_table, trigger_name;
$$;