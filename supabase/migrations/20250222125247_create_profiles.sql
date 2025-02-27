-- Description: Creates the profiles table for storing user profile information
-- Dependencies: auth.users table must exist (provided by Supabase)

-- Enable RLS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    bio text,
    stage_name text,
    avatar_url text,
    cover_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    first_name text,
    last_name text,
    country text,
    gender text,
    phone text,
    musical_interests jsonb DEFAULT '{}'::jsonb,
    talents jsonb DEFAULT '{}'::jsonb,
    social_links jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT phone_format CHECK (
        (phone IS NULL) OR 
        (phone ~* '^\+?[0-9]{8,15}$'::text)
    )
);

-- Add table comments
COMMENT ON TABLE public.profiles IS 'Holds extended profile information for each user';
COMMENT ON COLUMN public.profiles.id IS 'References the auth.users.id';
COMMENT ON COLUMN public.profiles.bio IS 'User biography text';
COMMENT ON COLUMN public.profiles.stage_name IS 'Artist stage name';
COMMENT ON COLUMN public.profiles.musical_interests IS 'JSON object containing user musical interests';
COMMENT ON COLUMN public.profiles.talents IS 'JSON object containing user talents';
COMMENT ON COLUMN public.profiles.social_links IS 'JSON object containing user social links';

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles USING btree (phone);
CREATE INDEX IF NOT EXISTS profiles_stage_name_idx ON public.profiles USING btree (stage_name);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Add relationship with posts table
ALTER TABLE public.posts
ADD CONSTRAINT fk_posts_profiles
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;

COMMIT;
