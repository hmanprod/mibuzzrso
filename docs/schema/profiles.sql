create table public.profiles (
  id uuid not null,
  bio text null,
  genre text null default ''::text,
  avatar_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  first_name text null,
  last_name text null,
  country text null,
  gender text null,
  phone text null,
  stage_name text null,
  facebook_url text null,
  instagram_url text null,
  tiktok_url text null,
  activities json null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint phone_format check (
    (
      (phone is null)
      or (phone ~* '^\+?[0-9]{8,15}$'::text)
    )
  )
) TABLESPACE pg_default;

create index IF not exists profiles_phone_idx on public.profiles using btree (phone) TABLESPACE pg_default;

create index IF not exists profiles_stage_name_idx on public.profiles using btree (stage_name) TABLESPACE pg_default;

create index IF not exists profiles_facebook_url_idx on public.profiles using btree (facebook_url) TABLESPACE pg_default;

create index IF not exists profiles_instagram_url_idx on public.profiles using btree (instagram_url) TABLESPACE pg_default;

create index IF not exists profiles_tiktok_url_idx on public.profiles using btree (tiktok_url) TABLESPACE pg_default;