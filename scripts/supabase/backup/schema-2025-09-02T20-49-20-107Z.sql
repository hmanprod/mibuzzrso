DROP TABLE IF EXISTS _migrations CASCADE;
-- Table: _migrations
CREATE TABLE _migrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  executed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TABLE IF EXISTS challenge_jury CASCADE;
-- Table: challenge_jury
CREATE TABLE challenge_jury (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  challenge_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP TABLE IF EXISTS challenge_participations CASCADE;
-- Table: challenge_participations
CREATE TABLE challenge_participations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  audio_url text,
  submission_url text
);

DROP TABLE IF EXISTS challenge_votes CASCADE;
-- Table: challenge_votes
CREATE TABLE challenge_votes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  challenge_id uuid,
  participation_id uuid,
  voter_id uuid,
  points integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  vote_type text NOT NULL DEFAULT 'public'::text,
  technique_points integer,
  originalite_points integer,
  interpretation_points integer
);

DROP TABLE IF EXISTS challenges CASCADE;
-- Table: challenges
CREATE TABLE challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::challenge_status,
  instructions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  type text NOT NULL DEFAULT 'remix'::challenge_type,
  end_at timestamp with time zone NOT NULL,
  winner_uid uuid,
  winner_displayname text,
  description_short text,
  participants_count integer NOT NULL DEFAULT 0,
  winning_prize text,
  survey jsonb,
  condition_url text,
  visual_url text,
  youtube_iframe text,
  user_id uuid NOT NULL,
  medias jsonb DEFAULT '[]'::jsonb,
  voting_type character varying NOT NULL DEFAULT 'public'::character varying
);

DROP TABLE IF EXISTS challenges_medias CASCADE;
-- Table: challenges_medias
CREATE TABLE challenges_medias (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  challenge_id uuid NOT NULL,
  media_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

DROP TABLE IF EXISTS comments CASCADE;
-- Table: comments
CREATE TABLE comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  content text NOT NULL,
  player_time numeric,
  user_id uuid NOT NULL,
  media_id uuid,
  parent_comment_id uuid,
  post_id uuid,
  challenge_id uuid
);

DROP TABLE IF EXISTS daily_comments CASCADE;
-- Table: daily_comments
CREATE TABLE daily_comments (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid,
  comment_date date DEFAULT CURRENT_DATE,
  comment_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

DROP TABLE IF EXISTS daily_media_uploads CASCADE;
-- Table: daily_media_uploads
CREATE TABLE daily_media_uploads (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid,
  upload_date date DEFAULT CURRENT_DATE,
  media_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

DROP TABLE IF EXISTS follows CASCADE;
-- Table: follows
CREATE TABLE follows (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

DROP TABLE IF EXISTS interactions CASCADE;
-- Table: interactions
CREATE TABLE interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  type text NOT NULL,
  user_id uuid NOT NULL,
  post_id uuid,
  comment_id uuid,
  media_id uuid,
  challenge_id uuid
);

DROP TABLE IF EXISTS medias CASCADE;
-- Table: medias
CREATE TABLE medias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  media_type text NOT NULL,
  media_url text NOT NULL,
  media_public_id text NOT NULL,
  duration numeric,
  title text,
  description text,
  user_id uuid NOT NULL,
  media_cover_url text NOT NULL,
  author text
);

DROP TABLE IF EXISTS points_history CASCADE;
-- Table: points_history
CREATE TABLE points_history (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid,
  points_change integer NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

DROP TABLE IF EXISTS post_participations CASCADE;
-- Table: post_participations
CREATE TABLE post_participations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  audio_url text,
  submission_url text
);

DROP TABLE IF EXISTS posts CASCADE;
-- Table: posts
CREATE TABLE posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  content text,
  user_id uuid NOT NULL,
  post_type text NOT NULL DEFAULT 'post'::post_type,
  challenge_id uuid
);

DROP TABLE IF EXISTS posts_medias CASCADE;
-- Table: posts_medias
CREATE TABLE posts_medias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  post_id uuid NOT NULL,
  media_id uuid NOT NULL,
  position integer NOT NULL
);

DROP TABLE IF EXISTS profiles CASCADE;
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
  cover_url text,
  is_admin boolean DEFAULT false,
  points integer DEFAULT 5,
  pseudo_url text,
  status character varying NOT NULL DEFAULT 'active'::character varying
);

DROP TABLE IF EXISTS profiles_beatmakers CASCADE;
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

DROP TABLE IF EXISTS unique_likes CASCADE;
-- Table: unique_likes
CREATE TABLE unique_likes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  media_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

DROP TABLE IF EXISTS users_to_clean CASCADE;
-- Table: users_to_clean
CREATE TABLE users_to_clean (
  user_id uuid NOT NULL,
  name text
);

DROP TABLE IF EXISTS weekly_rankings CASCADE;
-- Table: weekly_rankings
CREATE TABLE weekly_rankings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid,
  week_start date,
  week_end date,
  points_earned integer DEFAULT 0,
  rank integer,
  created_at timestamp with time zone DEFAULT now()
);

DROP TABLE IF EXISTS weekly_rankings_refresh_state CASCADE;
-- Table: weekly_rankings_refresh_state
CREATE TABLE weekly_rankings_refresh_state (
  last_refresh timestamp with time zone,
  is_refreshing boolean DEFAULT false
);

