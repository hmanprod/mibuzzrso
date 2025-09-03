--  BACKUP SQL REQUIREMENTS

-- Fonction pour obtenir la version de PostgreSQL
create function version()
returns text
language sql
security definer
as $$
  select version();
$$;

create function get_all_tables()
returns table (name text)
language plpgsql
security definer
as $$
begin
  return query
  SELECT t.tablename::text as name
  FROM pg_catalog.pg_tables t
  WHERE t.schemaname = 'public';
end;
$$;

create function get_table_columns(p_table_name text)
returns table (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
)
language plpgsql
security definer
as $$
begin
  return query
  SELECT 
    col.column_name::text,
    col.data_type::text,
    col.is_nullable::text,
    col.column_default::text
  FROM information_schema.columns col
  WHERE col.table_schema = 'public'
    AND col.table_name = p_table_name
  ORDER BY col.ordinal_position;
end;
$$;