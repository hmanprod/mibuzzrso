--  MIGRATE SQL REQUIREMENTS
create function exec_sql(sql_statement text)
returns void
language plpgsql
security definer
as $$
begin
  execute sql_statement;
end;
$$;