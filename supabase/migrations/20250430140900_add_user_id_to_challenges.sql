-- Description: Adds user_id column to challenges table and related RLS policies
-- Dependencies: challenges table must exist, profiles table must exist

BEGIN;

-- Add user_id column
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL REFERENCES auth.users(id);

-- Add column comment
COMMENT ON COLUMN public.challenges.user_id IS 'The user who created the challenge';

-- Add RLS policies
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Policy for viewing challenges (anyone can view)
CREATE POLICY "Anyone can view challenges"
    ON public.challenges
    FOR SELECT
    USING (true);

-- Policy for creating challenges (only admins)
CREATE POLICY "Only admins can create challenges"
    ON public.challenges
    FOR INSERT
    WITH CHECK (
        (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()) = true
    );

-- Policy for updating challenges (only admin or creator)
CREATE POLICY "Only admin or creator can update challenges"
    ON public.challenges
    FOR UPDATE
    USING (
        auth.uid() = user_id OR
        (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()) = true
    );

-- Policy for deleting challenges (only admin or creator)
CREATE POLICY "Only admin or creator can delete challenges"
    ON public.challenges
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()) = true
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS challenges_user_id_idx ON public.challenges(user_id);

COMMIT;
