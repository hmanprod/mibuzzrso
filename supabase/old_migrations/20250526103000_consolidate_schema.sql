-- Consolidation of all tables and their latest structure
-- This migration serves as a reference point for the current schema
-- Note: Existing migrations are kept for history

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bio TEXT,
    stage_name TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    first_name TEXT,
    last_name TEXT,
    country TEXT,
    gender TEXT,
    phone TEXT,
    label TEXT,
    musical_interests JSONB DEFAULT '[]'::jsonb,
    talents JSONB DEFAULT '[]'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    points INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    pseudo_url TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked'))
);

-- Create post_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE post_type AS ENUM ('post', 'challenge', 'challenge_participation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT,
    content TEXT,
    description TEXT,
    type post_type DEFAULT 'post',
    challenge_id UUID REFERENCES public.challenges(id),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Medias table
CREATE TABLE IF NOT EXISTS public.medias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('audio', 'video')),
    duration INTEGER,
    media_public_id TEXT,
    media_cover_url TEXT,
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('remix', 'live_mix')),
    status TEXT CHECK (status IN ('draft', 'active', 'completed')),
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    winning_prize TEXT,
    winner_uid UUID REFERENCES auth.users(id),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Challenge participations
CREATE TABLE IF NOT EXISTS public.challenge_participations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    challenge_id UUID REFERENCES public.challenges(id),
    user_id UUID REFERENCES auth.users(id),
    media_id UUID REFERENCES public.medias(id),
    UNIQUE(challenge_id, user_id)
);

-- Interactions table
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    post_id UUID REFERENCES public.posts(id),
    media_id UUID REFERENCES public.medias(id),
    challenge_id UUID REFERENCES public.challenges(id),
    type TEXT CHECK (type IN ('like', 'share', 'save', 'comment_like', 'read')),
    UNIQUE(user_id, post_id, media_id, type),
    CHECK (
        (post_id IS NOT NULL AND media_id IS NULL AND challenge_id IS NULL) OR
        (post_id IS NULL AND media_id IS NOT NULL AND challenge_id IS NULL) OR
        (post_id IS NULL AND media_id IS NULL AND challenge_id IS NOT NULL)
    )
);

-- Follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    follower_id UUID REFERENCES auth.users(id),
    following_id UUID REFERENCES auth.users(id),
    UNIQUE(follower_id, following_id)
);

-- Points history table
CREATE TABLE IF NOT EXISTS public.points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    points_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    source TEXT DEFAULT 'system',
    CONSTRAINT positive_points CHECK (points_change > 0)
);

-- Weekly rankings table
CREATE TABLE IF NOT EXISTS public.weekly_rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    points INTEGER DEFAULT 0,
    rank INTEGER,
    UNIQUE(week_start, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content TEXT NOT NULL,
    player_time INTEGER,
    user_id UUID REFERENCES auth.users(id),
    media_id UUID REFERENCES public.medias(id),
    CONSTRAINT valid_player_time CHECK (player_time >= 0)
);

-- Posts medias table
CREATE TABLE IF NOT EXISTS public.posts_medias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.medias(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    UNIQUE(post_id, position)
);

-- Challenge votes table
CREATE TABLE IF NOT EXISTS public.challenge_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    challenge_id UUID REFERENCES public.challenges(id),
    voter_id UUID REFERENCES auth.users(id),
    participant_id UUID REFERENCES auth.users(id),
    UNIQUE(challenge_id, voter_id, participant_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_pseudo_url ON public.profiles(pseudo_url);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_medias_user_id ON public.medias(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_post_id ON public.interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_interactions_media_id ON public.interactions(media_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON public.points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_rankings_user_id ON public.weekly_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_media_id ON public.comments(media_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_challenge_id ON public.challenge_votes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_posts_medias_post_id ON public.posts_medias(post_id);
CREATE INDEX IF NOT EXISTS idx_posts_medias_media_id ON public.posts_medias(media_id);
CREATE INDEX IF NOT EXISTS idx_posts_challenge_id ON public.posts(challenge_id);

-- Add comments on tables
COMMENT ON TABLE public.profiles IS 'User profile information with extended details';
COMMENT ON TABLE public.posts IS 'User posts and content';
COMMENT ON TABLE public.medias IS 'Audio and video media files';
COMMENT ON TABLE public.challenges IS 'Music challenges and competitions';
COMMENT ON TABLE public.interactions IS 'User interactions with posts and media';
COMMENT ON TABLE public.follows IS 'User follow relationships';
COMMENT ON TABLE public.points_history IS 'History of points earned by users';
COMMENT ON TABLE public.weekly_rankings IS 'Weekly user rankings based on points';
COMMENT ON TABLE public.comments IS 'User comments on media';
COMMENT ON TABLE public.challenge_votes IS 'Votes for challenge participants';
COMMENT ON TABLE public.posts_medias IS 'Relation between posts and media files with position ordering';
