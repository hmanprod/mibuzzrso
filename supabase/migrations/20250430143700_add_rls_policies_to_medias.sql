-- Description: Adds RLS policies for medias and challenges_medias tables
-- Dependencies: medias and challenges_medias tables must exist

BEGIN;

-- Enable RLS on medias table
ALTER TABLE public.medias ENABLE ROW LEVEL SECURITY;

-- Policy for viewing medias (anyone can view)
CREATE POLICY "Anyone can view medias"
    ON public.medias
    FOR SELECT
    USING (true);

-- Enable RLS on challenges_medias table
ALTER TABLE public.challenges_medias ENABLE ROW LEVEL SECURITY;

-- Policy for viewing challenges_medias (anyone can view)
CREATE POLICY "Anyone can view challenges_medias"
    ON public.challenges_medias
    FOR SELECT
    USING (true);

-- Policy for inserting into challenges_medias (only admin or challenge creator)
CREATE POLICY "Only admin or challenge creator can insert challenges_medias"
    ON public.challenges_medias
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = challenge_id AND (
                c.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.is_admin = true
                )
            )
        )
    );

-- Policy for deleting from challenges_medias (only admin or challenge creator)
CREATE POLICY "Only admin or challenge creator can delete challenges_medias"
    ON public.challenges_medias
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.challenges c
            WHERE c.id = challenge_id AND (
                c.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.is_admin = true
                )
            )
        )
    );

COMMIT;
