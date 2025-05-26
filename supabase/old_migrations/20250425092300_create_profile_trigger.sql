-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
        social_links
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
        '{}'::jsonb       -- empty social_links object
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
