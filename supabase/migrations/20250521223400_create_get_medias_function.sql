-- Create media_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('audio', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing function with any signature
DO $$ BEGIN
    DROP FUNCTION IF EXISTS get_medias(UUID, media_type, TEXT, INTEGER, INTEGER);
EXCEPTION WHEN undefined_function OR invalid_parameter_value THEN
    -- Ignore errors if function doesn't exist or has different parameters
    NULL;
END $$;

-- Create the get_medias function
CREATE OR REPLACE FUNCTION get_medias(
    p_current_user_id UUID DEFAULT NULL,
    p_media_type media_type DEFAULT NULL,
    p_search_term TEXT DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    media_url TEXT,
    media_type media_type,
    duration INTEGER,
    media_public_id TEXT,
    created_at TIMESTAMPTZ,
    profile JSONB,
    likes BIGINT,
    is_liked BOOLEAN,
    is_followed BOOLEAN
) AS $$
DECLARE
    v_offset INTEGER := (p_page - 1) * p_limit;
BEGIN
    RETURN QUERY
    WITH media_results AS (
        SELECT 
            m.id,
            m.title,
            m.media_url,
            m.media_type,
            CAST(m.duration AS INTEGER),
            m.media_public_id,
            m.created_at,
            pr.id as profile_id,
            pr.stage_name,
            pr.avatar_url,
            pr.pseudo_url
        FROM medias m
        JOIN posts_medias pm ON m.id = pm.media_id
        JOIN posts p ON pm.post_id = p.id
        JOIN profiles pr ON p.user_id = pr.id
        WHERE 
            (p_media_type IS NULL OR m.media_type = p_media_type)
            AND (
                p_search_term IS NULL 
                OR m.title ILIKE '%' || p_search_term || '%'
                OR pr.stage_name ILIKE '%' || p_search_term || '%'
            )
    )
    SELECT
        mr.id,
        mr.title,
        mr.media_url,
        mr.media_type,
        mr.duration,
        mr.media_public_id,
        mr.created_at,
        jsonb_build_object(
            'id', mr.profile_id,
            'stage_name', mr.stage_name,
            'avatar_url', mr.avatar_url,
            'pseudo_url', mr.pseudo_url
        ) as profile,
        COALESCE(
            (SELECT COUNT(*)
            FROM interactions i
            WHERE i.media_id = mr.id AND i.type = 'like'),
            0
        ) as likes,
        COALESCE(
            (SELECT EXISTS (
                SELECT 1
                FROM interactions i
                WHERE i.media_id = mr.id 
                AND i.user_id = p_current_user_id 
                AND i.type = 'like'
            )),
            FALSE
        ) as is_liked,
        COALESCE(
            (SELECT EXISTS (
                SELECT 1
                FROM follows f
                WHERE f.follower_id = p_current_user_id
                AND f.following_id = mr.profile_id
            )),
            FALSE
        ) as is_followed
    FROM media_results mr
    ORDER BY mr.created_at DESC
    LIMIT p_limit
    OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_medias(UUID, media_type, TEXT, INTEGER, INTEGER) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION get_medias(UUID, media_type, TEXT, INTEGER, INTEGER) IS 'Get medias with various filters: media type, search term, and pagination';
