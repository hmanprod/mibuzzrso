create table public.challenge_participations (
  id uuid not null default gen_random_uuid (),
  challenge_id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone null default now(),
  audio_url text null,
  submission_url text null,
  constraint challenge_participations_pkey primary key (id),
  constraint challenge_participations_challenge_id_user_id_key unique (challenge_id, user_id),
  constraint challenge_participations_challenge_id_fkey foreign KEY (challenge_id) references challenges (id) on delete CASCADE,
  constraint challenge_participations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_challenge_participations_submission_url on public.challenge_participations using btree (submission_url) TABLESPACE pg_default;