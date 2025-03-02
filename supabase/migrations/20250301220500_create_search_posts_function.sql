-- Create a function to search posts across multiple tables
CREATE OR REPLACE FUNCTION search_posts(search_term TEXT, page_num INTEGER DEFAULT 1, items_per_page INTEGER DEFAULT 10, current_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    content TEXT,
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
BEGIN
    RETURN QUERY
    WITH post_matches AS (
        -- Search in post content
        SELECT 
            p.id AS post_id,
            p.content AS post_content,
            p.created_at AS post_created_at,
            p.updated_at AS post_updated_at,
            p.user_id,
            'post_content' AS match_source
        FROM posts p
        WHERE p.content ILIKE '%' || search_term || '%'
        
        UNION
        
        -- Search in profile stage names
        SELECT 
            p.id AS post_id,
            p.content AS post_content,
            p.created_at AS post_created_at,
            p.updated_at AS post_updated_at,
            p.user_id,
            'profile_stage_name' AS match_source
        FROM posts p
        JOIN profiles pr ON p.user_id = pr.id
        WHERE pr.stage_name ILIKE '%' || search_term || '%'
        
        UNION
        
        -- Search in media titles
        SELECT 
            p.id AS post_id,
            p.content AS post_content,
            p.created_at AS post_created_at,
            p.updated_at AS post_updated_at,
            p.user_id,
            'media_title' AS match_source
        FROM posts p
        JOIN posts_medias pm ON p.id = pm.post_id
        JOIN medias m ON pm.media_id = m.id
        WHERE m.title ILIKE '%' || search_term || '%'
    ),
    
    -- Get all unique post IDs from the matches
    unique_posts AS (
        SELECT DISTINCT pm.post_id
        FROM post_matches pm
    ),
    
    -- Count likes for each post
    post_likes AS (
        SELECT 
            i.post_id,
            COUNT(*) AS likes_count
        FROM interactions i
        WHERE i.type = 'like' AND i.post_id IS NOT NULL
        GROUP BY i.post_id
    ),
    
    -- Get media information for each post
    post_media AS (
        SELECT 
            pm.post_id,
            ARRAY_AGG(
                jsonb_build_object(
                    'id', m.id,
                    'title', m.title,
                    'media_url', m.media_url,
                    'media_type', m.media_type,
                    'duration', m.duration,
                    'public_id', m.public_id,
                    'created_at', m.created_at,
                    'updated_at', m.updated_at
                )
            ) AS medias
        FROM posts_medias pm
        JOIN medias m ON pm.media_id = m.id
        GROUP BY pm.post_id
    ),
    
    -- Check if current user has liked each post
    user_likes AS (
        SELECT 
            i.post_id,
            TRUE AS is_liked
        FROM interactions i
        WHERE 
            i.type = 'like' 
            AND i.post_id IS NOT NULL 
            AND i.user_id = current_user_id
    ),
    
    -- Check if current user follows the post author
    user_follows AS (
        SELECT 
            pm.user_id AS following_id,
            TRUE AS is_followed
        FROM follows f
        JOIN post_matches pm ON f.following_id = pm.user_id
        WHERE 
            f.follower_id = current_user_id
    )
    
    -- Final query combining all information
    SELECT 
        post_matches_distinct.post_id AS id,
        post_matches_distinct.post_content AS content,
        post_matches_distinct.post_created_at AS created_at,
        post_matches_distinct.post_updated_at AS updated_at,
        post_matches_distinct.user_id,
        jsonb_build_object(
            'id', pr.id,
            'stage_name', pr.stage_name,
            'avatar_url', pr.avatar_url
        ) AS profile,
        COALESCE(pmed.medias, '{}'::JSONB[]) AS medias,
        COALESCE(pl.likes_count, 0) AS likes,
        COALESCE(ul.is_liked, FALSE) AS is_liked,
        COALESCE(uf.is_followed, FALSE) AS is_followed,
        post_matches_distinct.match_source
    FROM (
        SELECT DISTINCT ON (post_matches.post_id) 
            post_matches.post_id,
            post_matches.post_content,
            post_matches.post_created_at,
            post_matches.post_updated_at,
            post_matches.user_id,
            post_matches.match_source
        FROM post_matches
    ) post_matches_distinct
    JOIN profiles pr ON post_matches_distinct.user_id = pr.id
    LEFT JOIN post_likes pl ON post_matches_distinct.post_id = pl.post_id
    LEFT JOIN post_media pmed ON post_matches_distinct.post_id = pmed.post_id
    LEFT JOIN user_likes ul ON post_matches_distinct.post_id = ul.post_id
    LEFT JOIN user_follows uf ON post_matches_distinct.user_id = uf.following_id
    ORDER BY post_matches_distinct.post_created_at DESC
    LIMIT items_per_page
    OFFSET (page_num - 1) * items_per_page;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_posts(TEXT, INTEGER, INTEGER, UUID) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION search_posts IS 'Searches for posts across post content, profile stage names, and media titles, returning data in the ExtendedPost format';
