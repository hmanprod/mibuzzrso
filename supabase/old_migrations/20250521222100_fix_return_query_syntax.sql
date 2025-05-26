-- Fix return query syntax in get_posts function
CREATE OR REPLACE FUNCTION get_posts(
    p_current_user_id UUID DEFAULT NULL,
    p_profile_id UUID DEFAULT NULL,
    p_post_type TEXT DEFAULT NULL,
    p_liked_only BOOLEAN DEFAULT FALSE,
    p_media_type TEXT DEFAULT NULL,
    p_search_term TEXT DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    post_type TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    profile JSONB,
    medias JSONB[],
    likes BIGINT,
    is_liked BOOLEAN,
    is_followed BOOLEAN,
    match_source TEXT
) AS $$
DECLARE
    v_offset INTEGER := (p_page - 1) * p_limit;
BEGIN
    -- Search posts if search term is provided
    IF p_search_term IS NOT NULL AND p_search_term <> '' THEN
        RETURN QUERY
        WITH search_results AS (
            -- Search in post content
            SELECT 
                p.id,
                p.content,
                p.post_type,
                p.created_at,
                p.updated_at,
                p.user_id,
                'post_content'::TEXT AS source_type,
                1 AS priority -- Highest priority for content matches
            FROM posts p
            WHERE p.content ILIKE '%' || p_search_term || '%'
            
            UNION ALL
            
            -- Search in profile stage names
            SELECT 
                p.id,
                p.content,
                p.post_type,
                p.created_at,
                p.updated_at,
                p.user_id,
                'profile_stage_name'::TEXT,
                2
            FROM posts p
            JOIN profiles pr ON p.user_id = pr.id
            WHERE pr.stage_name ILIKE '%' || p_search_term || '%'
            
            UNION ALL
            
            -- Search in media titles
            SELECT 
                p.id,
                p.content,
                p.post_type,
                p.created_at,
                p.updated_at,
                p.user_id,
                'media_title'::TEXT,
                3
            FROM posts p
            JOIN posts_medias pm ON p.id = pm.post_id
            JOIN medias m ON pm.media_id = m.id
            WHERE m.title ILIKE '%' || p_search_term || '%'
        ),
        ranked_results AS (
            SELECT DISTINCT ON (sr.id) 
                sr.id,
                sr.content,
                sr.post_type,
                sr.created_at,
                sr.updated_at,
                sr.user_id,
                sr.source_type
            FROM search_results sr
            ORDER BY sr.id, sr.priority
        )
        SELECT
            rr.id,
            rr.content,
            rr.post_type::TEXT,
            rr.created_at,
            rr.updated_at,
            rr.user_id,
            jsonb_build_object(
                'id', pr.id,
                'stage_name', pr.stage_name,
                'avatar_url', pr.avatar_url,
                'pseudo_url', pr.pseudo_url
            ),
            COALESCE(
                array_agg(
                    jsonb_build_object(
                        'id', m.id,
                        'title', m.title,
                        'media_url', m.media_url,
                        'media_type', m.media_type,
                        'duration', m.duration,
                        'media_public_id', m.media_public_id,
                        'created_at', m.created_at,
                        'updated_at', m.updated_at
                    )
                ),
                '{}'::JSONB[]
            ),
            COALESCE(
                (SELECT COUNT(*)
                FROM interactions i
                WHERE i.post_id = rr.id AND i.type = 'like'),
                0
            ),
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM interactions i
                    WHERE i.post_id = rr.id 
                    AND i.user_id = p_current_user_id 
                    AND i.type = 'like'
                )),
                FALSE
            ),
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_id = p_current_user_id
                    AND f.following_id = rr.user_id
                )),
                FALSE
            ),
            rr.source_type
        FROM ranked_results rr
        JOIN profiles pr ON rr.user_id = pr.id
        LEFT JOIN posts_medias pm ON rr.id = pm.post_id
        LEFT JOIN medias m ON pm.media_id = m.id
        WHERE (p_post_type IS NULL OR rr.post_type = p_post_type::post_type)
        GROUP BY rr.id, rr.content, rr.post_type, rr.created_at, rr.updated_at, 
                 rr.user_id, rr.source_type, pr.id, pr.stage_name, pr.avatar_url, pr.pseudo_url
        ORDER BY rr.created_at DESC
        LIMIT p_limit
        OFFSET v_offset;
        
    -- Get liked posts
    ELSIF p_liked_only = TRUE AND p_current_user_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.content,
            p.post_type::TEXT,
            p.created_at,
            p.updated_at,
            p.user_id,
            jsonb_build_object(
                'id', pr.id,
                'stage_name', pr.stage_name,
                'avatar_url', pr.avatar_url,
                'pseudo_url', pr.pseudo_url
            ),
            COALESCE(
                array_agg(
                    jsonb_build_object(
                        'id', m.id,
                        'title', m.title,
                        'media_url', m.media_url,
                        'media_type', m.media_type,
                        'duration', m.duration,
                        'media_public_id', m.media_public_id,
                        'created_at', m.created_at,
                        'updated_at', m.updated_at
                    )
                ),
                '{}'::JSONB[]
            ),
            COALESCE(
                (SELECT COUNT(*)
                FROM interactions i2
                WHERE i2.post_id = p.id AND i2.type = 'like'),
                0
            ),
            TRUE,
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_id = p_current_user_id
                    AND f.following_id = p.user_id
                )),
                FALSE
            ),
            'liked_post'::TEXT
        FROM posts p
        JOIN profiles pr ON p.user_id = pr.id
        JOIN interactions i ON p.id = i.post_id
        LEFT JOIN posts_medias pm ON p.id = pm.post_id
        LEFT JOIN medias m ON pm.media_id = m.id
        WHERE i.user_id = p_current_user_id
        AND i.type = 'like'
        AND (p_post_type IS NULL OR p.post_type = p_post_type::post_type)
        GROUP BY p.id, p.content, p.post_type, p.created_at, p.updated_at, 
                 p.user_id, pr.id, pr.stage_name, pr.avatar_url, pr.pseudo_url
        ORDER BY p.created_at DESC
        LIMIT p_limit
        OFFSET v_offset;
    
    -- Get profile posts
    ELSIF p_profile_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.content,
            p.post_type::TEXT,
            p.created_at,
            p.updated_at,
            p.user_id,
            jsonb_build_object(
                'id', pr.id,
                'stage_name', pr.stage_name,
                'avatar_url', pr.avatar_url,
                'pseudo_url', pr.pseudo_url
            ),
            COALESCE(
                array_agg(
                    jsonb_build_object(
                        'id', m.id,
                        'title', m.title,
                        'media_url', m.media_url,
                        'media_type', m.media_type,
                        'duration', m.duration,
                        'media_public_id', m.media_public_id,
                        'created_at', m.created_at,
                        'updated_at', m.updated_at
                    )
                ),
                '{}'::JSONB[]
            ),
            COALESCE(
                (SELECT COUNT(*)
                FROM interactions i
                WHERE i.post_id = p.id AND i.type = 'like'),
                0
            ),
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM interactions i
                    WHERE i.post_id = p.id 
                    AND i.user_id = p_current_user_id 
                    AND i.type = 'like'
                )),
                FALSE
            ),
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_id = p_current_user_id
                    AND f.following_id = p.user_id
                )),
                FALSE
            ),
            'profile_post'::TEXT
        FROM posts p
        JOIN profiles pr ON p.user_id = pr.id
        LEFT JOIN posts_medias pm ON p.id = pm.post_id
        LEFT JOIN medias m ON pm.media_id = m.id
        WHERE p.user_id = p_profile_id
        AND (p_post_type IS NULL OR p.post_type = p_post_type::post_type)
        AND (p_media_type IS NULL OR m.media_type::TEXT = p_media_type)
        GROUP BY p.id, p.content, p.post_type, p.created_at, p.updated_at, 
                 p.user_id, pr.id, pr.stage_name, pr.avatar_url, pr.pseudo_url
        ORDER BY p.created_at DESC
        LIMIT p_limit
        OFFSET v_offset;
    
    -- Get regular posts (feed)
    ELSE
        RETURN QUERY
        SELECT 
            p.id,
            p.content,
            p.post_type::TEXT,
            p.created_at,
            p.updated_at,
            p.user_id,
            jsonb_build_object(
                'id', pr.id,
                'stage_name', pr.stage_name,
                'avatar_url', pr.avatar_url,
                'pseudo_url', pr.pseudo_url
            ),
            COALESCE(
                array_agg(
                    jsonb_build_object(
                        'id', m.id,
                        'title', m.title,
                        'media_url', m.media_url,
                        'media_type', m.media_type,
                        'duration', m.duration,
                        'media_public_id', m.media_public_id,
                        'created_at', m.created_at,
                        'updated_at', m.updated_at
                    )
                ),
                '{}'::JSONB[]
            ),
            COALESCE(
                (SELECT COUNT(*)
                FROM interactions i
                WHERE i.post_id = p.id AND i.type = 'like'),
                0
            ),
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM interactions i
                    WHERE i.post_id = p.id 
                    AND i.user_id = p_current_user_id 
                    AND i.type = 'like'
                )),
                FALSE
            ),
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_id = p_current_user_id
                    AND f.following_id = p.user_id
                )),
                FALSE
            ),
            'feed_post'::TEXT
        FROM posts p
        JOIN profiles pr ON p.user_id = pr.id
        LEFT JOIN posts_medias pm ON p.id = pm.post_id
        LEFT JOIN medias m ON pm.media_id = m.id
        WHERE (p_post_type IS NULL OR p.post_type = p_post_type::post_type)
        GROUP BY p.id, p.content, p.post_type, p.created_at, p.updated_at, 
                 p.user_id, pr.id, pr.stage_name, pr.avatar_url, pr.pseudo_url
        ORDER BY p.created_at DESC
        LIMIT p_limit
        OFFSET v_offset;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_posts(UUID, UUID, TEXT, BOOLEAN, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION get_posts IS 'Get posts with various filters: regular feed, profile posts, liked posts, or search results. Includes pseudo_url and fixes all column ambiguities.';
