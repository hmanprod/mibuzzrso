-- Consolidation of all functions and triggers
-- This migration contains the latest version of all functions

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    initial_points INTEGER := 5;
BEGIN
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
        points,
        status
    ) VALUES (
        NEW.id,
        NOW(),
        NOW(),
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        initial_points,
        'active'
    );
    
    INSERT INTO public.points_history (
        user_id,
        points_change,
        reason,
        source
    ) VALUES (
        NEW.id,
        initial_points,
        'Sign up bonus',
        'system'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get posts with interactions
CREATE OR REPLACE FUNCTION public.get_posts(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    content TEXT,
    user_id UUID,
    profile JSONB,
    medias JSONB,
    likes INTEGER,
    is_liked BOOLEAN,
    is_followed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.created_at,
        p.content,
        p.user_id,
        jsonb_build_object(
            'id', prof.id,
            'stage_name', prof.stage_name,
            'avatar_url', prof.avatar_url,
            'pseudo_url', prof.pseudo_url
        ) as profile,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', m.id,
                    'title', m.title,
                    'media_url', m.media_url,
                    'media_type', m.media_type,
                    'duration', m.duration,
                    'media_public_id', m.media_public_id,
                    'media_cover_url', m.media_cover_url
                )
            ) FILTER (WHERE m.id IS NOT NULL),
            '[]'::jsonb
        ) as medias,
        COUNT(DISTINCT l.id) AS likes,
        EXISTS (
            SELECT 1 FROM public.interactions il 
            WHERE il.post_id = p.id 
            AND il.user_id = p_user_id 
            AND il.type = 'like'
        ) as is_liked,
        EXISTS (
            SELECT 1 FROM public.follows f 
            WHERE f.follower_id = p_user_id 
            AND f.following_id = p.user_id
        ) as is_followed
    FROM public.posts p
    LEFT JOIN public.profiles prof ON p.user_id = prof.id
    LEFT JOIN public.medias m ON m.id = p.id
    LEFT JOIN public.interactions l ON l.post_id = p.id AND l.type = 'like'
    GROUP BY p.id, p.created_at, p.content, p.user_id, prof.id, prof.stage_name, prof.avatar_url, prof.pseudo_url
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get media with likes
CREATE OR REPLACE FUNCTION public.get_media_with_likes(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    title TEXT,
    media_url TEXT,
    media_type TEXT,
    duration INTEGER,
    media_public_id TEXT,
    media_cover_url TEXT,
    user_id UUID,
    profile JSONB,
    likes INTEGER,
    is_liked BOOLEAN,
    is_followed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.created_at,
        m.title,
        m.media_url,
        m.media_type,
        m.duration,
        m.media_public_id,
        m.media_cover_url,
        m.user_id,
        jsonb_build_object(
            'id', p.id,
            'stage_name', p.stage_name,
            'avatar_url', p.avatar_url,
            'pseudo_url', p.pseudo_url
        ) as profile,
        COUNT(DISTINCT l.id) AS likes,
        EXISTS (
            SELECT 1 FROM public.interactions il 
            WHERE il.media_id = m.id 
            AND il.user_id = p_user_id 
            AND il.type = 'like'
        ) as is_liked,
        EXISTS (
            SELECT 1 FROM public.follows f 
            WHERE f.follower_id = p_user_id 
            AND f.following_id = m.user_id
        ) as is_followed
    FROM public.medias m
    LEFT JOIN public.profiles p ON m.user_id = p.id
    LEFT JOIN public.interactions l ON l.media_id = m.id AND l.type = 'like'
    GROUP BY m.id, m.created_at, m.title, m.media_url, m.media_type, 
             m.duration, m.media_public_id, m.media_cover_url, m.user_id,
             p.id, p.stage_name, p.avatar_url, p.pseudo_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add points for media upload
CREATE OR REPLACE FUNCTION public.add_points_for_media()
RETURNS TRIGGER AS $$
DECLARE
    points_to_add INTEGER := 10;
BEGIN
    -- Add points to the user's profile
    UPDATE public.profiles 
    SET points = points + points_to_add
    WHERE id = NEW.user_id;

    -- Record the points in history
    INSERT INTO public.points_history (
        user_id,
        points_change,
        reason,
        source
    ) VALUES (
        NEW.user_id,
        points_to_add,
        'Media upload',
        'media'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for media points
DROP TRIGGER IF EXISTS on_media_created ON public.medias;
CREATE TRIGGER on_media_created
    AFTER INSERT ON public.medias
    FOR EACH ROW EXECUTE FUNCTION public.add_points_for_media();

-- Add more functions here as needed...

COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation and initial points';
COMMENT ON FUNCTION public.get_posts() IS 'Gets posts with interactions and profile information';
COMMENT ON FUNCTION public.get_media_with_likes() IS 'Gets media with likes and profile information';
COMMENT ON FUNCTION public.add_points_for_media() IS 'Adds points for media uploads';
