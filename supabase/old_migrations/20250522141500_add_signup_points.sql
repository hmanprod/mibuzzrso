-- Add signup points to new users
-- This migration modifies the handle_new_user function to award 5 points to new users
-- and records this in the points_history table

-- Update the handle_new_user function to include points initialization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    initial_points INTEGER := 5; -- 5 points for signing up
BEGIN
    -- Insert a row into public.profiles when a new user is created
    INSERT INTO public.profiles (
        id,
        created_at,
        updated_at,
        bio,
        stage_name,
        avatar_url,
        cover_url,
        first_name,
        last_name,
        country,
        gender,
        phone,
        label,
        musical_interests,
        talents,
        social_links,
        points -- Add points field
    ) VALUES (
        NEW.id,            -- id from auth.users
        NOW(),            -- created_at
        NOW(),            -- updated_at
        NULL,             -- bio
        NULL,             -- stage_name
        NULL,             -- avatar_url
        NULL,             -- cover_url
        NULL,             -- first_name
        NULL,             -- last_name
        NULL,             -- country
        NULL,             -- gender
        NULL,             -- phone
        NULL,             -- label
        '[]'::jsonb,      -- empty musical_interests array
        '[]'::jsonb,      -- empty talents array
        '{}'::jsonb,      -- empty social_links object
        initial_points    -- award initial points
    );
    
    -- Record the points award in points_history
    INSERT INTO public.points_history (
        user_id,
        points_change,
        reason,
        created_at
    ) VALUES (
        NEW.id,
        initial_points,
        'Sign up bonus',
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on the updated function
COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation by creating a profile and awarding 5 points for signing up';
