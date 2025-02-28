-- Description: Creates the follows table for user following relationships
-- Dependencies: profiles table must exist

BEGIN;

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    
    -- Add foreign key constraints
    CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id)
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id)
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Add unique constraint to prevent duplicate follows
    CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
    
    -- Prevent users from following themselves
    CONSTRAINT follows_no_self_follow CHECK (follower_id != following_id)
);

-- Add table comments
COMMENT ON TABLE public.follows IS 'Stores user following relationships';
COMMENT ON COLUMN public.follows.follower_id IS 'The user who is following';
COMMENT ON COLUMN public.follows.following_id IS 'The user who is being followed';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows USING btree (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows USING btree (following_id);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all follows"
    ON public.follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);

-- Create function to get followers count
CREATE OR REPLACE FUNCTION public.get_followers_count(profile_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::integer
    FROM public.follows
    WHERE following_id = profile_id;
$$;

-- Create function to get following count
CREATE OR REPLACE FUNCTION public.get_following_count(profile_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::integer
    FROM public.follows
    WHERE follower_id = profile_id;
$$;

-- Create function to check if a user is following another
CREATE OR REPLACE FUNCTION public.is_following(follower_id uuid, following_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.follows
        WHERE follower_id = $1
        AND following_id = $2
    );
$$;

COMMIT;
