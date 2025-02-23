-- Description: Creates the challenges table and related enums for the challenge system
-- Dependencies: auth.users table must exist (provided by Supabase)

BEGIN;

-- Create challenge types enum if not exists
DO $$ BEGIN
    CREATE TYPE public.challenge_type AS ENUM ('remix', 'original', 'cover');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create challenge status enum if not exists
DO $$ BEGIN
    CREATE TYPE public.challenge_status AS ENUM ('draft', 'published', 'closed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text NOT NULL,
    status public.challenge_status NOT NULL DEFAULT 'draft'::challenge_status,
    instructions text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    type public.challenge_type NOT NULL DEFAULT 'remix'::challenge_type,
    end_at timestamptz NOT NULL,
    winner_uid uuid,
    winner_displayname text,
    description_short text,
    participants_count integer NOT NULL DEFAULT 0,
    winning_prize text,
    survey jsonb,
    condition_url text,
    medias jsonb DEFAULT '[]'::jsonb,
    visual_url text,
    youtube_iframe text,
    CONSTRAINT challenges_pkey PRIMARY KEY (id),
    CONSTRAINT challenges_winner_uid_fkey FOREIGN KEY (winner_uid) REFERENCES auth.users(id),
    CONSTRAINT medias_is_array CHECK (jsonb_typeof(medias) = 'array'::text)
);

-- Add table comments
COMMENT ON TABLE public.challenges IS 'Musical challenges that users can participate in';
COMMENT ON COLUMN public.challenges.title IS 'Challenge title';
COMMENT ON COLUMN public.challenges.description IS 'Full challenge description';
COMMENT ON COLUMN public.challenges.status IS 'Current status of the challenge';
COMMENT ON COLUMN public.challenges.medias IS 'Array of media attachments';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_challenges_end_at ON public.challenges USING btree (end_at);
CREATE INDEX IF NOT EXISTS idx_challenges_winner_uid ON public.challenges USING btree (winner_uid);
CREATE INDEX IF NOT EXISTS idx_challenges_visual ON public.challenges USING btree (visual_url);
CREATE INDEX IF NOT EXISTS idx_challenges_participants_count ON public.challenges USING btree (participants_count);
CREATE INDEX IF NOT EXISTS idx_challenges_youtube_url ON public.challenges USING btree (youtube_iframe);
CREATE INDEX IF NOT EXISTS idx_challenges_winning_prize ON public.challenges USING btree (winning_prize);
CREATE INDEX IF NOT EXISTS idx_challenges_medias ON public.challenges USING gin (medias);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_challenges_updated_at();

-- Enable Row Level Security
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Challenges are viewable by everyone"
    ON public.challenges FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert challenges"
    ON public.challenges FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM public.admin_users
    ));

CREATE POLICY "Only admins can update challenges"
    ON public.challenges FOR UPDATE
    USING (auth.uid() IN (
        SELECT user_id FROM public.admin_users
    ))
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM public.admin_users
    ));

COMMIT;
