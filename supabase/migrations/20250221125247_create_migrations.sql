create table public._migrations (
  id uuid not null default gen_random_uuid (),
  name text not null,
  executed_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint _migrations_pkey primary key (id),
  constraint _migrations_name_key unique (name)
) TABLESPACE pg_default;