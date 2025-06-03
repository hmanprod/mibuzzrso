-- Suppression de l'ancienne fonction get_posts
DROP FUNCTION IF EXISTS get_posts(INTEGER, INTEGER, UUID, TEXT, TEXT, UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS get_posts(UUID, UUID, TEXT, BOOLEAN, TEXT, TEXT, INTEGER, INTEGER);

-- Modification de la fonction get_posts pour éviter les doublons dans la recherche
CREATE OR REPLACE FUNCTION get_posts(
    p_current_user_id UUID,
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
        WITH post_matches AS (
            SELECT DISTINCT ON (p.id) -- Utilisation de DISTINCT ON pour ne garder qu'une seule occurrence par post
                p.id AS post_id,
                FIRST_VALUE(
                    CASE
                        WHEN p.content ILIKE '%' || p_search_term || '%' THEN 'post_content'
                        WHEN pr.stage_name ILIKE '%' || p_search_term || '%' THEN 'profile_stage_name'
                        ELSE 'media_title'
                    END
                ) OVER (
                    PARTITION BY p.id 
                    ORDER BY 
                        CASE
                            WHEN p.content ILIKE '%' || p_search_term || '%' THEN 1
                            WHEN pr.stage_name ILIKE '%' || p_search_term || '%' THEN 2
                            ELSE 3
                        END
                ) AS match_source
            FROM posts p
            JOIN profiles pr ON p.user_id = pr.id
            LEFT JOIN posts_medias pm ON p.id = pm.post_id
            LEFT JOIN medias m ON pm.media_id = m.id
            WHERE 
                p.content ILIKE '%' || p_search_term || '%'
                OR pr.stage_name ILIKE '%' || p_search_term || '%'
                OR m.title ILIKE '%' || p_search_term || '%'
        )
        
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
                'pseudo_url', pr.pseudo_url,
                'is_admin', pr.is_admin
            ) AS profile,
            COALESCE(
                (SELECT ARRAY_AGG(
                    jsonb_build_object(
                        'id', m.id,
                        'title', m.title,
                        'media_url', m.media_url,
                        'media_type', m.media_type,
                        'duration', m.duration,
                        'media_public_id', m.media_public_id,
                        'media_cover_url', m.media_cover_url,
                        'created_at', m.created_at,
                        'updated_at', m.updated_at
                    )
                )
                FROM posts_medias pm
                JOIN medias m ON pm.media_id = m.id
                WHERE pm.post_id = p.id
                GROUP BY pm.post_id),
                '{}'::JSONB[]
            ) AS medias,
            COALESCE(
                (SELECT COUNT(*)
                FROM interactions i
                WHERE i.post_id = p.id AND i.type = 'like'),
                0
            ) AS likes,
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM interactions i
                    WHERE i.post_id = p.id 
                    AND i.user_id = p_current_user_id 
                    AND i.type = 'like'
                )),
                FALSE
            ) AS is_liked,
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_id = p_current_user_id
                    AND f.following_id = p.user_id
                )),
                FALSE
            ) AS is_followed,
            pm.match_source
        FROM posts p
        JOIN post_matches pm ON p.id = pm.post_id
        JOIN profiles pr ON p.user_id = pr.id
        WHERE CASE 
            WHEN p_post_type = 'feed' THEN p.post_type IN ('post', 'challenge_participation')
            ELSE p_post_type IS NULL OR p.post_type = p_post_type::post_type
        END
        GROUP BY p.id, pr.id, pm.match_source
        ORDER BY p.created_at DESC
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
                'pseudo_url', pr.pseudo_url,
                'is_admin', pr.is_admin
            ) AS profile,
            COALESCE(
                (SELECT ARRAY_AGG(
                    jsonb_build_object(
                        'id', m.id,
                        'title', m.title,
                        'media_url', m.media_url,
                        'media_type', m.media_type,
                        'duration', m.duration,
                        'media_public_id', m.media_public_id,
                        'media_cover_url', m.media_cover_url,
                        'created_at', m.created_at,
                        'updated_at', m.updated_at
                    )
                )
                FROM posts_medias pm
                JOIN medias m ON pm.media_id = m.id
                WHERE pm.post_id = p.id
                GROUP BY pm.post_id),
                '{}'::JSONB[]
            ) AS medias,
            COALESCE(
                (SELECT COUNT(*)
                FROM interactions i
                WHERE i.post_id = p.id AND i.type = 'like'),
                0
            ) AS likes,
            TRUE AS is_liked, -- We know it's liked because we're filtering for liked posts
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_id = p_current_user_id
                    AND f.following_id = p.user_id
                )),
                FALSE
            ) AS is_followed,
            'liked_post' AS match_source
        FROM posts p
        JOIN profiles pr ON p.user_id = pr.id
        JOIN interactions i ON p.id = i.post_id
        JOIN posts_medias pm ON p.id = pm.post_id
        WHERE i.user_id = p_current_user_id
        AND i.type = 'like'
        AND CASE 
            WHEN p_post_type = 'feed' THEN p.post_type IN ('post', 'challenge_participation')
            ELSE p_post_type IS NULL OR p.post_type = p_post_type::post_type
        END
        GROUP BY p.id, pr.id
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
                'pseudo_url', pr.pseudo_url,
                'is_admin', pr.is_admin
            ) AS profile,
            COALESCE(
                (SELECT ARRAY_AGG(
                    jsonb_build_object(
                        'id', m.id,
                        'title', m.title,
                        'media_url', m.media_url,
                        'media_type', m.media_type,
                        'duration', m.duration,
                        'media_public_id', m.media_public_id,
                        'media_cover_url', m.media_cover_url,
                        'created_at', m.created_at,
                        'updated_at', m.updated_at
                    )
                )
                FROM posts_medias pm
                JOIN medias m ON pm.media_id = m.id
                WHERE pm.post_id = p.id
                AND (p_media_type IS NULL OR m.media_type::TEXT = p_media_type)
                GROUP BY pm.post_id),
                '{}'::JSONB[]
            ) AS medias,
            COALESCE(
                (SELECT COUNT(*)
                FROM interactions i
                WHERE i.post_id = p.id AND i.type = 'like'),
                0
            ) AS likes,
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM interactions i
                    WHERE i.post_id = p.id 
                    AND i.user_id = p_current_user_id 
                    AND i.type = 'like'
                )),
                FALSE
            ) AS is_liked,
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_id = p_current_user_id
                    AND f.following_id = p.user_id
                )),
                FALSE
            ) AS is_followed,
            'profile_post' AS match_source
        FROM posts p
        JOIN profiles pr ON p.user_id = pr.id
        JOIN posts_medias pm ON p.id = pm.post_id
        JOIN medias m ON pm.media_id = m.id
        WHERE p.user_id = p_profile_id
        AND CASE 
            WHEN p_post_type = 'feed' THEN p.post_type IN ('post', 'challenge_participation')
            ELSE p_post_type IS NULL OR p.post_type = p_post_type::post_type
        END
        AND (p_media_type IS NULL OR m.media_type::TEXT = p_media_type)
        GROUP BY p.id, pr.id
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
                'pseudo_url', pr.pseudo_url,
                'is_admin', pr.is_admin
            ) AS profile,
            COALESCE(
                (SELECT ARRAY_AGG(
                    jsonb_build_object(
                        'id', m.id,
                        'title', m.title,
                        'media_url', m.media_url,
                        'media_type', m.media_type,
                        'duration', m.duration,
                        'media_public_id', m.media_public_id,
                        'media_cover_url', m.media_cover_url,
                        'created_at', m.created_at,
                        'updated_at', m.updated_at
                    )
                )
                FROM posts_medias pm
                JOIN medias m ON pm.media_id = m.id
                WHERE pm.post_id = p.id
                GROUP BY pm.post_id),
                '{}'::JSONB[]
            ) AS medias,
            COALESCE(
                (SELECT COUNT(*)
                FROM interactions i
                WHERE i.post_id = p.id AND i.type = 'like'),
                0
            ) AS likes,
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM interactions i
                    WHERE i.post_id = p.id 
                    AND i.user_id = p_current_user_id 
                    AND i.type = 'like'
                )),
                FALSE
            ) AS is_liked,
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_id = p_current_user_id
                    AND f.following_id = p.user_id
                )),
                FALSE
            ) AS is_followed,
            'feed_post' AS match_source
        FROM posts p
        JOIN profiles pr ON p.user_id = pr.id
        JOIN posts_medias pm ON p.id = pm.post_id
        WHERE CASE 
            WHEN p_post_type = 'feed' THEN p.post_type IN ('post', 'challenge_participation')
            ELSE p_post_type IS NULL OR p.post_type = p_post_type::post_type
        END
        GROUP BY p.id, pr.id
        ORDER BY p.created_at DESC
        LIMIT p_limit
        OFFSET v_offset;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Ajout des permissions
GRANT EXECUTE ON FUNCTION get_posts(UUID, UUID, TEXT, BOOLEAN, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- Ajout du commentaire
COMMENT ON FUNCTION get_posts(UUID, UUID, TEXT, BOOLEAN, TEXT, TEXT, INTEGER, INTEGER)
IS 'Récupère les posts avec support de recherche amélioré (sans doublons), filtrage par type, profil et likes. Inclut les médias et les interactions.';
