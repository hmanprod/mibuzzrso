-- Description: Adds isAdmin column to profiles table
-- Dependencies: profiles table must exist

BEGIN;

-- Add isAdmin column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Add column comment
COMMENT ON COLUMN public.profiles.is_admin IS 'Boolean flag indicating if the user is an admin';

-- Update RLS policies to allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles
    USING (
        (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()) = true
    );

COMMIT;
