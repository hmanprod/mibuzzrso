-- Drop the existing function first
DROP FUNCTION IF EXISTS get_user_media_with_likes(UUID, INTEGER, INTEGER);

-- Create the new function
CREATE OR REPLACE FUNCTION public.get_user_media_with_likes(
    p_current_user_id UUID,
    p_limit INTEGER DEFAULT 12,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    title TEXT,
    media_url TEXT,
    media_type VARCHAR,
    duration INTEGER,
    media_public_id TEXT,
    media_cover_url TEXT,
    user_id UUID,
    profile JSONB,
    likes BIGINT,
    is_liked BOOLEAN,
    is_followed BOOLEAN,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH media_counts AS (
        SELECT COUNT(*) as total
        FROM public.medias m
        WHERE m.user_id = p_current_user_id
    )
    SELECT 
        m.id,
        m.created_at,
        m.title,
        m.media_url,
        m.media_type::VARCHAR,
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
        COUNT(DISTINCT l.id)::BIGINT AS likes,
        EXISTS (
            SELECT 1 FROM public.interactions il 
            WHERE il.media_id = m.id 
            AND il.user_id = p_current_user_id 
            AND il.type = 'like'
        ) as is_liked,
        EXISTS (
            SELECT 1 FROM public.follows f 
            WHERE f.follower_id = p_current_user_id 
            AND f.following_id = m.user_id
        ) as is_followed,
        mc.total as total_count
    FROM public.medias m
    CROSS JOIN media_counts mc
    LEFT JOIN public.profiles p ON m.user_id = p.id
    LEFT JOIN public.interactions l ON l.media_id = m.id AND l.type = 'like'
    WHERE m.user_id = p_current_user_id
    GROUP BY m.id, m.created_at, m.title, m.media_url, m.media_type, 
             m.duration, m.media_public_id, m.media_cover_url, m.user_id,
             p.id, p.stage_name, p.avatar_url, p.pseudo_url, mc.total
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
