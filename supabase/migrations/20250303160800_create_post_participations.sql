create table public.post_participations (
  id uuid not null default gen_random_uuid (),
  post_id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone null default now(),
  audio_url text null,
  submission_url text null,
  constraint post_participations_pkey primary key (id),
  constraint post_participations_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_participations_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists post_participations_submission_url_idx on public.post_participations using btree (submission_url) TABLESPACE pg_default;

create unique INDEX IF not exists post_participations_post_id_user_id_key on public.post_participations using btree (post_id, user_id) TABLESPACE pg_default;