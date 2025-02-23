-- Description: Creates the challenge_participations table for tracking user participation in challenges
-- Dependencies: challenges table and auth.users must exist

BEGIN;

-- Create challenge participations table
CREATE TABLE IF NOT EXISTS public.challenge_participations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    challenge_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    audio_url text,
    submission_url text,
    CONSTRAINT challenge_participations_pkey PRIMARY KEY (id),
    CONSTRAINT challenge_participations_challenge_id_user_id_key UNIQUE (challenge_id, user_id),
    CONSTRAINT challenge_participations_challenge_id_fkey FOREIGN KEY (challenge_id) 
        REFERENCES public.challenges(id) ON DELETE CASCADE,
    CONSTRAINT challenge_participations_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add table comments
COMMENT ON TABLE public.challenge_participations IS 'Tracks user participation in musical challenges';
COMMENT ON COLUMN public.challenge_participations.challenge_id IS 'References the challenge being participated in';
COMMENT ON COLUMN public.challenge_participations.user_id IS 'References the participating user';
COMMENT ON COLUMN public.challenge_participations.audio_url IS 'URL to the audio submission';
COMMENT ON COLUMN public.challenge_participations.submission_url IS 'URL to any additional submission materials';

-- Create index
CREATE INDEX IF NOT EXISTS idx_challenge_participations_submission_url 
    ON public.challenge_participations USING btree (submission_url);

-- Enable Row Level Security
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Challenge participations are viewable by everyone"
    ON public.challenge_participations FOR SELECT
    USING (true);

CREATE POLICY "Users can submit their own participations"
    ON public.challenge_participations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participations"
    ON public.challenge_participations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create trigger to update challenge participants count
CREATE OR REPLACE FUNCTION update_challenge_participants_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.challenges
        SET participants_count = participants_count + 1
        WHERE id = NEW.challenge_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.challenges
        SET participants_count = participants_count - 1
        WHERE id = OLD.challenge_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participants_count
    AFTER INSERT OR DELETE ON public.challenge_participations
    FOR EACH ROW
    EXECUTE FUNCTION update_challenge_participants_count();

COMMIT;
