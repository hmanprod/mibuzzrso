-- Fichier de schéma consolidé pour Mibuzz
-- Créé le 2025-06-03

-- Ce fichier contient tous les schémas des tables de la base de données
-- Organisé par sections logiques : utilisateurs, posts, médias, interactions, etc.

-- Note : Les schémas seront ajoutés au fur et à mesure que vous me les fournissez

-- Section 1: Configuration initiale
BEGIN;

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types et énumérations
CREATE TYPE public.challenge_status AS ENUM (
    'draft',
    'active',
    'voting',
    'completed'
);

CREATE TYPE public.challenge_type AS ENUM (
    'remix',
    'cover',
    'original'
);

CREATE TYPE public.media_type AS ENUM (
    'audio',
    'video'
);

CREATE TYPE public.post_type AS ENUM (
    'post',
    'challenge',
    'feedback'
);

-- Fonctions utilitaires
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_pseudo_url_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stage_name IS NOT NULL AND NEW.pseudo_url IS NULL THEN
        NEW.pseudo_url = LOWER(REGEXP_REPLACE(NEW.stage_name, '[^a-zA-Z0-9]', '-', 'g'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_profiles_beatmakers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: auth.users est fourni par Supabase

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    bio text NULL,
    genre text NULL DEFAULT ''::text,
    avatar_url text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    first_name text NULL,
    last_name text NULL,
    country text NULL,
    gender text NULL,
    phone text NULL,
    stage_name text NULL,
    facebook_url text NULL,
    instagram_url text NULL,
    tiktok_url text NULL,
    activities json NULL,
    genres jsonb NULL,
    label text NULL,
    musical_interests jsonb NULL DEFAULT '{}'::jsonb,
    talents jsonb NULL DEFAULT '{}'::jsonb,
    social_links jsonb NULL DEFAULT '{}'::jsonb,
    cover_url text NULL,
    is_admin boolean NULL DEFAULT false,
    points integer NULL DEFAULT 5,
    pseudo_url text NULL,
    status character varying(20) NOT NULL DEFAULT 'active'::character varying,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id)
        REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT phone_format CHECK ((phone IS NULL) OR (phone ~* '^\+?[0-9]{8,15}$'::text))
) TABLESPACE pg_default;

-- Index pour optimiser les recherches
CREATE UNIQUE INDEX IF NOT EXISTS profiles_pseudo_url_idx
    ON public.profiles USING btree (pseudo_url) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_profiles_status
    ON public.profiles USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS profiles_phone_idx
    ON public.profiles USING btree (phone) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS profiles_stage_name_idx
    ON public.profiles USING btree (stage_name) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS profiles_facebook_url_idx
    ON public.profiles USING btree (facebook_url) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS profiles_instagram_url_idx
    ON public.profiles USING btree (instagram_url) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS profiles_tiktok_url_idx
    ON public.profiles USING btree (tiktok_url) TABLESPACE pg_default;

-- Trigger pour générer automatiquement le pseudo_url
CREATE TRIGGER ensure_pseudo_url
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_pseudo_url_trigger();

-- Table des profils beatmakers
CREATE TABLE public.profiles_beatmakers (
    id uuid NOT NULL,
    bio text NULL DEFAULT ''::text,
    genre text NULL DEFAULT 'Non spécifié'::text,
    avatar_url text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    first_name text NULL,
    last_name text NULL,
    country text NULL,
    expectation text NULL,
    discovery_source text NULL,
    gender text NULL,
    phone text NULL,
    stage_name text NULL,
    facebook_url text NULL,
    instagram_url text NULL,
    tiktok_url text NULL,
    activities jsonb NULL DEFAULT '[]'::jsonb,
    CONSTRAINT profiles_beatmakers_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_beatmakers_id_fkey FOREIGN KEY (id)
        REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT activities_is_array CHECK (jsonb_typeof(activities) = 'array'::text),
    CONSTRAINT phone_format CHECK ((phone IS NULL) OR (phone ~* '^\+?[0-9]{8,15}$'::text))
) TABLESPACE pg_default;

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_beatmakers_phone
    ON public.profiles_beatmakers USING btree (phone) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_profiles_beatmakers_stage_name
    ON public.profiles_beatmakers USING btree (stage_name) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_profiles_beatmakers_facebook_url
    ON public.profiles_beatmakers USING btree (facebook_url) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_profiles_beatmakers_instagram_url
    ON public.profiles_beatmakers USING btree (instagram_url) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_profiles_beatmakers_tiktok_url
    ON public.profiles_beatmakers USING btree (tiktok_url) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_profiles_beatmakers_activities
    ON public.profiles_beatmakers USING gin (activities) TABLESPACE pg_default;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_profiles_beatmakers_updated_at
    BEFORE UPDATE ON profiles_beatmakers
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_beatmakers_updated_at();


-- Table de gestion des jurys pour les challenges
-- Table principale des challenges
CREATE TABLE public.challenges (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    status public.challenge_status NOT NULL DEFAULT 'draft'::challenge_status,
    instructions text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    type public.challenge_type NOT NULL DEFAULT 'remix'::challenge_type,
    end_at timestamp with time zone NOT NULL,
    winner_uid uuid NULL,
    winner_displayname text NULL,
    description_short text NULL,
    participants_count integer NOT NULL DEFAULT 0,
    winning_prize text NULL,
    survey jsonb NULL,
    condition_url text NULL,
    visual_url text NULL,
    youtube_iframe text NULL,
    user_id uuid NOT NULL,
    medias jsonb NULL DEFAULT '[]'::jsonb,
    voting_type character varying(10) NOT NULL DEFAULT 'public'::character varying,
    CONSTRAINT challenges_pkey PRIMARY KEY (id),
    CONSTRAINT challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id),
    CONSTRAINT challenges_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES profiles (id),
    CONSTRAINT challenges_winner_uid_fkey FOREIGN KEY (winner_uid) REFERENCES auth.users (id),
    CONSTRAINT challenges_voting_type_check CHECK (
        (voting_type)::text = ANY (ARRAY['public'::character varying, 'jury'::character varying]::text[])
    )
) TABLESPACE pg_default;

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_challenges_end_at 
    ON public.challenges USING btree (end_at) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_challenges_winner_uid 
    ON public.challenges USING btree (winner_uid) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_challenges_visual 
    ON public.challenges USING btree (visual_url) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_challenges_participants_count 
    ON public.challenges USING btree (participants_count) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_challenges_youtube_url 
    ON public.challenges USING btree (youtube_iframe) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS challenges_user_id_idx 
    ON public.challenges USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_challenges_winning_prize 
    ON public.challenges USING btree (winning_prize) TABLESPACE pg_default;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_challenges_updated_at 
    BEFORE UPDATE ON challenges 
    FOR EACH ROW 
    EXECUTE FUNCTION update_challenges_updated_at();

-- Table des médias (audio/vidéo)
CREATE TABLE public.medias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    media_type public.media_type NOT NULL,
    media_url text NOT NULL,
    media_public_id text NOT NULL,
    duration numeric(10, 2) NULL,
    title text NULL,
    description text NULL,
    user_id uuid NOT NULL,
    media_cover_url text NOT NULL,
    author text NULL,
    CONSTRAINT medias_pkey PRIMARY KEY (id),
    CONSTRAINT medias_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT valid_cover_url CHECK (media_cover_url ~ '^https://.*cloudinary\.com/.*$'::text),
    CONSTRAINT valid_media CHECK (media_url ~ '^https://.*cloudinary\.com/.*$'::text)
) TABLESPACE pg_default;

-- Index pour optimiser les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_medias_user_id
    ON public.medias USING btree (user_id) TABLESPACE pg_default;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_medias_updated_at
    BEFORE UPDATE ON medias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table des posts
CREATE TABLE public.posts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    content text NULL,
    user_id uuid NOT NULL,
    post_type public.post_type NOT NULL DEFAULT 'post'::post_type,
    challenge_id uuid NULL,
    CONSTRAINT posts_pkey PRIMARY KEY (id),
    CONSTRAINT posts_challenge_id_fkey FOREIGN KEY (challenge_id)
        REFERENCES challenges (id),
    CONSTRAINT posts_profiles_fkey FOREIGN KEY (user_id)
        REFERENCES profiles (id)
) TABLESPACE pg_default;

-- Index pour optimiser les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_posts_user_id
    ON public.posts USING btree (user_id) TABLESPACE pg_default;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table de liaison entre posts et médias
CREATE TABLE public.posts_medias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    post_id uuid NOT NULL,
    media_id uuid NOT NULL,
    position integer NOT NULL,
    CONSTRAINT posts_medias_pkey PRIMARY KEY (id),
    CONSTRAINT unique_post_media UNIQUE (post_id, media_id),
    CONSTRAINT unique_post_media_position UNIQUE (post_id, "position"),
    CONSTRAINT posts_medias_media_id_fkey FOREIGN KEY (media_id)
        REFERENCES medias (id) ON DELETE CASCADE,
    CONSTRAINT posts_medias_post_id_fkey FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_posts_medias_post_id
    ON public.posts_medias USING btree (post_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_posts_medias_media_id
    ON public.posts_medias USING btree (media_id) TABLESPACE pg_default;

-- Table de gestion des migrations
-- Cette table garde une trace de toutes les migrations qui ont été exécutées
create table public._migrations (
  id uuid not null default gen_random_uuid(),
  name text not null,
  executed_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint _migrations_pkey primary key (id),
  constraint _migrations_name_key unique (name)
) TABLESPACE pg_default;

-- Table des commentaires
CREATE TABLE public.comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    content text NOT NULL,
    player_time numeric(10, 2) NULL,
    user_id uuid NOT NULL,
    media_id uuid NULL,
    parent_comment_id uuid NULL,
    post_id uuid NULL,
    challenge_id uuid NULL,
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges (id) ON DELETE CASCADE,
    CONSTRAINT comments_media_id_fkey FOREIGN KEY (media_id)
        REFERENCES medias (id) ON DELETE CASCADE,
    CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id)
        REFERENCES comments (id) ON DELETE CASCADE,
    CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_comments_user_id
    ON public.comments USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_comments_media_id
    ON public.comments USING btree (media_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id
    ON public.comments USING btree (parent_comment_id) TABLESPACE pg_default;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table pour suivre les commentaires quotidiens des utilisateurs
CREATE TABLE public.daily_comments (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NULL,
    comment_date date NULL DEFAULT CURRENT_DATE,
    comment_id uuid NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT daily_comments_pkey PRIMARY KEY (id),
    CONSTRAINT daily_comments_comment_id_fkey FOREIGN KEY (comment_id)
        REFERENCES comments (id),
    CONSTRAINT daily_comments_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- Index composite pour optimiser les recherches par utilisateur et date
CREATE INDEX IF NOT EXISTS idx_daily_comments_user_date
    ON public.daily_comments USING btree (user_id, comment_date) TABLESPACE pg_default;

-- Table pour suivre les uploads quotidiens de médias par utilisateur
CREATE TABLE public.daily_media_uploads (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NULL,
    upload_date date NULL DEFAULT CURRENT_DATE,
    media_id uuid NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT daily_media_uploads_pkey PRIMARY KEY (id),
    CONSTRAINT daily_media_uploads_user_id_upload_date_key UNIQUE (user_id, upload_date),
    CONSTRAINT daily_media_uploads_media_id_fkey FOREIGN KEY (media_id)
        REFERENCES medias (id),
    CONSTRAINT daily_media_uploads_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- Table de liaison entre challenges et medias
CREATE TABLE public.challenges_medias (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    challenge_id uuid NOT NULL,
    media_id uuid NOT NULL,
    position integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT challenges_medias_pkey PRIMARY KEY (id),
    CONSTRAINT unique_challenge_media UNIQUE (challenge_id, media_id),
    CONSTRAINT unique_challenge_media_position UNIQUE (challenge_id, "position"),
    CONSTRAINT challenges_medias_challenge_id_fkey FOREIGN KEY (challenge_id)
        REFERENCES challenges (id) ON DELETE CASCADE,
    CONSTRAINT challenges_medias_media_id_fkey FOREIGN KEY (media_id)
        REFERENCES medias (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Table de gestion des jurys pour les challenges
CREATE TABLE public.challenge_jury (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    challenge_id uuid NULL,
    user_id uuid NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT challenge_jury_pkey PRIMARY KEY (id),
    CONSTRAINT unique_jury_per_challenge UNIQUE (challenge_id, user_id),
    CONSTRAINT challenge_jury_challenge_id_fkey FOREIGN KEY (challenge_id) 
        REFERENCES challenges (id) ON DELETE CASCADE,
    CONSTRAINT challenge_jury_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS challenge_jury_challenge_id_idx 
    ON public.challenge_jury USING btree (challenge_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS challenge_jury_user_id_idx 
    ON public.challenge_jury USING btree (user_id) TABLESPACE pg_default;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE 
    ON challenge_jury FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Table des participations aux challenges
CREATE TABLE public.challenge_participations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    challenge_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    audio_url text NULL,
    submission_url text NULL,
    CONSTRAINT challenge_participations_pkey PRIMARY KEY (id),
    CONSTRAINT challenge_participations_challenge_id_user_id_key UNIQUE (challenge_id, user_id),
    CONSTRAINT challenge_participations_challenge_id_fkey FOREIGN KEY (challenge_id)
        REFERENCES challenges (id) ON DELETE CASCADE,
    CONSTRAINT challenge_participations_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES profiles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index pour optimiser les recherches sur submission_url
CREATE INDEX IF NOT EXISTS idx_challenge_participations_submission_url
    ON public.challenge_participations USING btree (submission_url) TABLESPACE pg_default;

-- Table des votes pour les participations aux challenges
CREATE TABLE public.challenge_votes (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    challenge_id uuid NULL,
    participation_id uuid NULL,
    voter_id uuid NULL,
    points integer NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    vote_type text NOT NULL DEFAULT 'public'::text,
    technique_points integer NULL,
    originalite_points integer NULL,
    interpretation_points integer NULL,
    CONSTRAINT challenge_votes_pkey PRIMARY KEY (id),
    CONSTRAINT unique_vote_per_participation UNIQUE (participation_id, voter_id),
    CONSTRAINT challenge_votes_challenge_id_fkey FOREIGN KEY (challenge_id)
        REFERENCES challenges (id) ON DELETE CASCADE,
    CONSTRAINT challenge_votes_participation_id_fkey FOREIGN KEY (participation_id)
        REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT challenge_votes_voter_id_fkey FOREIGN KEY (voter_id)
        REFERENCES auth.users (id) ON DELETE CASCADE,
    -- Contraintes de validation des points
    CONSTRAINT challenge_votes_points_check CHECK (
        points >= 0 AND points <= 5
    ),
    CONSTRAINT challenge_votes_technique_points_check CHECK (
        technique_points >= 0 AND technique_points <= 5
    ),
    CONSTRAINT challenge_votes_interpretation_points_check CHECK (
        interpretation_points >= 0 AND interpretation_points <= 5
    ),
    CONSTRAINT challenge_votes_originalite_points_check CHECK (
        originalite_points >= 0 AND originalite_points <= 5
    ),
    -- Contrainte sur le type de vote
    CONSTRAINT challenge_votes_vote_type_check CHECK (
        vote_type = ANY (ARRAY['public'::text, 'jury'::text])
    ),
    -- Contrainte pour s'assurer que les votes jury ont tous les critères remplis
    CONSTRAINT jury_vote_criteria_required CHECK (
        (vote_type = 'jury'::text AND
         technique_points IS NOT NULL AND
         originalite_points IS NOT NULL AND
         interpretation_points IS NOT NULL)
        OR
        (vote_type = 'public'::text AND
         technique_points IS NULL AND
         originalite_points IS NULL AND
         interpretation_points IS NULL)
    )
) TABLESPACE pg_default;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE
    ON challenge_votes FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Type pour les différents types d'interactions possibles
CREATE TYPE public.interaction_type AS ENUM (
    'like',
    'share',
    'save',
    'comment_like',
    'read',
    'comment'
);

-- Table des interactions utilisateurs (likes, partages, etc.)
CREATE TABLE public.interactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    type public.interaction_type NOT NULL,
    user_id uuid NOT NULL,
    post_id uuid NULL,
    comment_id uuid NULL,
    media_id uuid NULL,
    challenge_id uuid NULL,
    CONSTRAINT interactions_pkey PRIMARY KEY (id),
    CONSTRAINT interactions_challenge_id_fkey FOREIGN KEY (challenge_id)
        REFERENCES challenges (id),
    CONSTRAINT interactions_comment_id_fkey FOREIGN KEY (comment_id)
        REFERENCES comments (id) ON DELETE CASCADE,
    CONSTRAINT interactions_media_id_fkey FOREIGN KEY (media_id)
        REFERENCES medias (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT interactions_post_id_fkey FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT interactions_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index pour optimiser les différentes recherches d'interactions
CREATE INDEX IF NOT EXISTS idx_interactions_challenge_id
    ON public.interactions USING btree (challenge_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_media_comments
    ON public.interactions USING btree (user_id, media_id) TABLESPACE pg_default
    WHERE (media_id IS NOT NULL AND type = 'comment'::interaction_type);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id
    ON public.interactions USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_interactions_post_id
    ON public.interactions USING btree (post_id) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_comment_interaction
    ON public.interactions USING btree (user_id, comment_id, type) TABLESPACE pg_default
    WHERE comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_comment_id
    ON public.interactions USING btree (comment_id) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_media_interaction
    ON public.interactions USING btree (user_id, media_id, type) TABLESPACE pg_default
    WHERE (media_id IS NOT NULL
           AND type <> 'read'::interaction_type
           AND type <> 'comment'::interaction_type);

-- Table des likes uniques par média et utilisateur
CREATE TABLE public.unique_likes (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    media_id uuid NULL,
    user_id uuid NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT unique_likes_pkey PRIMARY KEY (id),
    CONSTRAINT unique_likes_media_id_user_id_key UNIQUE (media_id, user_id),
    CONSTRAINT unique_likes_media_id_fkey FOREIGN KEY (media_id)
        REFERENCES medias (id),
    CONSTRAINT unique_likes_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- Table des participations aux posts
CREATE TABLE public.post_participations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    audio_url text NULL,
    submission_url text NULL,
    CONSTRAINT post_participations_pkey PRIMARY KEY (id),
    CONSTRAINT post_participations_post_id_fkey FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT post_participations_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES profiles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index pour optimiser les recherches par URL de soumission
CREATE INDEX IF NOT EXISTS post_participations_submission_url_idx
    ON public.post_participations USING btree (submission_url) TABLESPACE pg_default;

-- Index unique pour éviter les participations multiples
CREATE UNIQUE INDEX IF NOT EXISTS post_participations_post_id_user_id_key
    ON public.post_participations USING btree (post_id, user_id) TABLESPACE pg_default;

-- Table de l'historique des points des utilisateurs
CREATE TABLE public.points_history (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NULL,
    points_change integer NOT NULL,
    reason text NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT points_history_pkey PRIMARY KEY (id),
    CONSTRAINT points_history_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES profiles (id)
) TABLESPACE pg_default;

-- Index pour optimiser les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_points_history_user_id
    ON public.points_history USING btree (user_id) TABLESPACE pg_default;

-- Index pour optimiser les recherches par date
CREATE INDEX IF NOT EXISTS idx_points_history_created_at
    ON public.points_history USING btree (created_at) TABLESPACE pg_default;

-- Table de gestion des abonnements entre utilisateurs
CREATE TABLE public.follows (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT follows_pkey PRIMARY KEY (id),
    CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
    CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id)
        REFERENCES profiles (id) ON DELETE CASCADE,
    CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id)
        REFERENCES profiles (id) ON DELETE CASCADE,
    CONSTRAINT follows_no_self_follow CHECK (follower_id <> following_id)
) TABLESPACE pg_default;

-- Index pour optimiser les recherches de followers et following
CREATE INDEX IF NOT EXISTS follows_follower_id_idx
    ON public.follows USING btree (follower_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS follows_following_id_idx
    ON public.follows USING btree (following_id) TABLESPACE pg_default;

-- Table d'état pour le rafraîchissement des classements hebdomadaires
CREATE TABLE public.weekly_rankings_refresh_state (
    last_refresh timestamp with time zone NULL,
    is_refreshing boolean NULL DEFAULT false
) TABLESPACE pg_default;

-- Table de maintenance pour les utilisateurs à nettoyer
CREATE TABLE public.users_to_clean (
    user_id uuid NOT NULL,
    name text NULL,
    CONSTRAINT users_to_clean_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_to_clean_user_id_key UNIQUE (user_id)
) TABLESPACE pg_default;

COMMIT;
