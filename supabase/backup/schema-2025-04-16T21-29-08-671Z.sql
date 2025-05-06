-- Table: profiles
CREATE TABLE profiles (
  id uuid NOT NULL,
  bio text,
  genre text DEFAULT ''::text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  first_name text,
  last_name text,
  country text,
  gender text,
  phone text,
  stage_name text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  activities json,
  genres jsonb,
  label text,
  musical_interests jsonb DEFAULT '{}'::jsonb,
  talents jsonb DEFAULT '{}'::jsonb,
  social_links jsonb DEFAULT '{}'::jsonb,
  cover_url text
);

-- Table: profiles_beatmakers
CREATE TABLE profiles_beatmakers (
  id uuid NOT NULL,
  bio text DEFAULT ''::text,
  genre text DEFAULT 'Non spécifié'::text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  first_name text,
  last_name text,
  country text,
  expectation text,
  discovery_source text,
  gender text,
  phone text,
  stage_name text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  activities jsonb DEFAULT '[]'::jsonb
);

-- Table: challenges
CREATE TABLE challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::challenge_status,
  instructions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  type USER-DEFINED NOT NULL DEFAULT 'remix'::challenge_type,
  end_at timestamp with time zone NOT NULL,
  winner_uid uuid,
  winner_displayname text,
  description_short text,
  participants_count integer NOT NULL DEFAULT 0,
  winning_prize text,
  survey jsonb,
  condition_url text,
  medias jsonb DEFAULT '[]'::jsonb,
  visual_url text,
  youtube_iframe text
);

-- Table: _migrations
CREATE TABLE _migrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  executed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: follows
CREATE TABLE follows (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: challenge_participations
CREATE TABLE challenge_participations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  audio_url text,
  submission_url text
);

-- Table: post_participations
CREATE TABLE post_participations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  audio_url text,
  submission_url text
);

-- Table: medias
CREATE TABLE medias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  media_type USER-DEFINED NOT NULL,
  media_url text NOT NULL,
  media_public_id text NOT NULL,
  duration numeric,
  title text,
  description text,
  user_id uuid NOT NULL,
  media_cover_url text
);

-- Table: posts
CREATE TABLE posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  content text,
  user_id uuid NOT NULL,
  post_type USER-DEFINED NOT NULL DEFAULT 'post'::post_type
);

-- Table: posts_medias
CREATE TABLE posts_medias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  post_id uuid NOT NULL,
  media_id uuid NOT NULL,
  position integer NOT NULL
);

-- Table: comments
CREATE TABLE comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  content text NOT NULL,
  player_time numeric,
  user_id uuid NOT NULL,
  media_id uuid NOT NULL,
  parent_comment_id uuid
);

-- Table: interactions
CREATE TABLE interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  type USER-DEFINED NOT NULL,
  user_id uuid NOT NULL,
  post_id uuid,
  comment_id uuid,
  media_id uuid
);

