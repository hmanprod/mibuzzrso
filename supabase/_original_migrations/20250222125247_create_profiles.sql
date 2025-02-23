-- Description: Creates the profiles table for storing user profile information
-- Dependencies: auth.users table must exist (provided by Supabase)

-- Enable RLS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    bio text,
    genre text DEFAULT ''::text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    first_name text,
    last_name text,
    country text,
    gender text,
    phone text,
    stage_name text,
    facebook_url text,
    instagram_url text,
    tiktok_url text,
    activities jsonb DEFAULT '{}'::jsonb,
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
COMMENT ON COLUMN public.profiles.activities IS 'JSON object containing user activities and preferences';

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles USING btree (phone);
CREATE INDEX IF NOT EXISTS profiles_stage_name_idx ON public.profiles USING btree (stage_name);
CREATE INDEX IF NOT EXISTS profiles_facebook_url_idx ON public.profiles USING btree (facebook_url);
CREATE INDEX IF NOT EXISTS profiles_instagram_url_idx ON public.profiles USING btree (instagram_url);
CREATE INDEX IF NOT EXISTS profiles_tiktok_url_idx ON public.profiles USING btree (tiktok_url);

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

COMMIT;
