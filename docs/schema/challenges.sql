create table public.challenges (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text not null,
  status public.challenge_status not null default 'draft'::challenge_status,
  instructions text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  type public.challenge_type not null default 'remix'::challenge_type,
  end_at timestamp with time zone not null,
  winner_uid uuid null,
  winner_displayname text null,
  description_short text null,
  participants_count integer not null default 0,
  winning_prize text null,
  survey jsonb null,
  condition_url text null,
  medias jsonb null default '[]'::jsonb,
  visual_url text null,
  youtube_iframe text null,
  constraint challenges_pkey primary key (id),
  constraint challenges_winner_uid_fkey foreign KEY (winner_uid) references auth.users (id),
  constraint medias_is_array check ((jsonb_typeof(medias) = 'array'::text))
) TABLESPACE pg_default;

create index IF not exists idx_challenges_end_at on public.challenges using btree (end_at) TABLESPACE pg_default;

create index IF not exists idx_challenges_winner_uid on public.challenges using btree (winner_uid) TABLESPACE pg_default;

create index IF not exists idx_challenges_visual on public.challenges using btree (visual_url) TABLESPACE pg_default;

create index IF not exists idx_challenges_participants_count on public.challenges using btree (participants_count) TABLESPACE pg_default;

create index IF not exists idx_challenges_youtube_url on public.challenges using btree (youtube_iframe) TABLESPACE pg_default;

create index IF not exists idx_challenges_winning_prize on public.challenges using btree (winning_prize) TABLESPACE pg_default;

create index IF not exists idx_challenges_medias on public.challenges using gin (medias) TABLESPACE pg_default;

create trigger update_challenges_updated_at BEFORE
update on challenges for EACH row
execute FUNCTION update_challenges_updated_at ();