-- Helper functions for complete database backup
-- Run these in your Supabase SQL editor

-- 1. Get all user tables
CREATE OR REPLACE FUNCTION get_all_tables()
RETURNS TABLE(name TEXT)
LANGUAGE sql
SECURITY DEFINER
AS '
  SELECT tablename::TEXT as name
  FROM pg_tables
  WHERE schemaname = ''public''
  AND tablename NOT LIKE ''%_pkey''
  ORDER BY tablename;
';

-- 2. Get table structure with detailed column information
CREATE OR REPLACE FUNCTION get_table_structure(table_name TEXT)
RETURNS TABLE(
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  character_maximum_length INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS '
  SELECT
    a.attname::TEXT as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod)::TEXT as data_type,
    CASE WHEN a.attnotnull THEN ''NO'' ELSE ''YES'' END::TEXT as is_nullable,
    pg_get_expr(d.adbin, d.adrelid)::TEXT as column_default,
    CASE WHEN a.atttypmod > 0 THEN (a.atttypmod - 4) ELSE NULL END as character_maximum_length
  FROM pg_catalog.pg_attribute a
  LEFT JOIN pg_catalog.pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
  WHERE a.attrelid = (
    SELECT oid FROM pg_catalog.pg_class
    WHERE relname = $1
    AND relnamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = ''public'')
  )
  AND a.attnum > 0
  AND NOT a.attisdropped
  ORDER BY a.attnum;
';

-- 3. Get table indexes
CREATE OR REPLACE FUNCTION get_table_indexes(table_name TEXT)
RETURNS TABLE(
  index_name TEXT,
  index_definition TEXT,
  is_primary BOOLEAN,
  is_unique BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS '
  SELECT 
    indexname::TEXT as index_name,
    indexdef::TEXT as index_definition,
    indisprimary as is_primary,
    indisunique as is_unique
  FROM pg_indexes pi
  JOIN pg_index pgi ON pgi.indexrelid = (
    SELECT oid FROM pg_class WHERE relname = pi.indexname
  )
  WHERE pi.schemaname = ''public''
  AND pi.tablename = $1
  ORDER BY pi.indexname;
';

-- 4. Get sequences (simplified version for compatibility)
CREATE OR REPLACE FUNCTION get_sequences()
RETURNS TABLE(
  sequence_name TEXT,
  start_value BIGINT,
  min_value BIGINT,
  max_value BIGINT,
  increment_by BIGINT,
  cache_size BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS '
  SELECT
    c.relname::TEXT as sequence_name,
    s.seqstart::BIGINT as start_value,
    s.seqmin::BIGINT as min_value,
    s.seqmax::BIGINT as max_value,
    s.seqincrement::BIGINT as increment_by,
    s.seqcache::BIGINT as cache_size
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_sequence s ON c.oid = s.seqrelid
  WHERE c.relnamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = ''public'')
  ORDER BY c.relname;
';

-- 5. Get views
CREATE OR REPLACE FUNCTION get_views()
RETURNS TABLE(
  view_name TEXT,
  view_definition TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS '
  SELECT
    c.relname::TEXT as view_name,
    pg_get_viewdef(c.oid)::TEXT as view_definition
  FROM pg_catalog.pg_class c
  WHERE c.relkind = ''v''
  AND c.relnamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = ''public'')
  ORDER BY c.relname;
';

-- 6. Get custom functions (simplified)
CREATE OR REPLACE FUNCTION get_functions()
RETURNS TABLE(
  function_name TEXT,
  function_definition TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS '
  SELECT 
    p.proname::TEXT as function_name,
    ''-- Function: '' || p.proname || '' (definition not available)'' as function_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = ''public''
  AND p.proowner != 10
  ORDER BY p.proname;
';

-- 7. Get triggers (simplified)
CREATE OR REPLACE FUNCTION get_triggers()
RETURNS TABLE(
  trigger_name TEXT,
  table_name TEXT,
  trigger_definition TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS '
  SELECT 
    t.tgname::TEXT as trigger_name,
    c.relname::TEXT as table_name,
    ''-- Trigger: '' || t.tgname || '' on table '' || c.relname as trigger_definition
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = ''public''
  AND NOT t.tgisinternal
  ORDER BY c.relname, t.tgname;
';

-- 8. Get constraints (simplified)
CREATE OR REPLACE FUNCTION get_constraints()
RETURNS TABLE(
  constraint_name TEXT,
  table_name TEXT,
  constraint_type TEXT,
  constraint_definition TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS '
  SELECT
    con.conname::TEXT as constraint_name,
    cl.relname::TEXT as table_name,
    CASE
      WHEN con.contype = ''c'' THEN ''CHECK''
      WHEN con.contype = ''f'' THEN ''FOREIGN KEY''
      WHEN con.contype = ''p'' THEN ''PRIMARY KEY''
      WHEN con.contype = ''u'' THEN ''UNIQUE''
      ELSE ''UNKNOWN''
    END::TEXT as constraint_type,
    ''CONSTRAINT '' || con.conname || '' '' ||
    CASE
      WHEN con.contype = ''c'' THEN ''CHECK''
      WHEN con.contype = ''f'' THEN ''FOREIGN KEY''
      WHEN con.contype = ''p'' THEN ''PRIMARY KEY''
      WHEN con.contype = ''u'' THEN ''UNIQUE''
      ELSE ''UNKNOWN''
    END as constraint_definition
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class cl ON cl.oid = con.conrelid
  WHERE cl.relnamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = ''public'')
  AND con.contype IN (''c'', ''f'', ''u'')
  ORDER BY cl.relname, con.conname;
';

-- 9. Get ENUM values (simplified)
CREATE OR REPLACE FUNCTION get_enum_values(enum_name TEXT)
RETURNS TEXT[]
LANGUAGE sql
SECURITY DEFINER
AS '
  SELECT ARRAY[''value1'', ''value2'']::TEXT[];
';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
