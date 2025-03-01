-- Create a function to search posts across multiple tables
CREATE OR REPLACE FUNCTION search_posts(search_term TEXT, page_num INTEGER DEFAULT 1, items_per_page INTEGER DEFAULT 10)
RETURNS TABLE (
    post_id UUID,
    post_content TEXT,
    post_created_at TIMESTAMPTZ,
    post_updated_at TIMESTAMPTZ,
    user_id UUID,
    profile_stage_name TEXT,
    profile_avatar_url TEXT,
    media_ids UUID[],
    media_titles TEXT[],
    media_urls TEXT[],
    media_types TEXT[],
    likes_count BIGINT,
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
            ARRAY_AGG(m.id) AS media_ids,
            ARRAY_AGG(m.title) AS media_titles,
            ARRAY_AGG(m.media_url) AS media_urls,
            ARRAY_AGG(m.media_type::TEXT) AS media_types
        FROM posts_medias pm
        JOIN medias m ON pm.media_id = m.id
        GROUP BY pm.post_id
    )
    
    -- Final query combining all information
    SELECT 
        post_matches_distinct.post_id,
        post_matches_distinct.post_content,
        post_matches_distinct.post_created_at,
        post_matches_distinct.post_updated_at,
        post_matches_distinct.user_id,
        pr.stage_name AS profile_stage_name,
        pr.avatar_url AS profile_avatar_url,
        COALESCE(pmed.media_ids, '{}'::UUID[]) AS media_ids,
        COALESCE(pmed.media_titles, '{}'::TEXT[]) AS media_titles,
        COALESCE(pmed.media_urls, '{}'::TEXT[]) AS media_urls,
        COALESCE(pmed.media_types, '{}'::TEXT[]) AS media_types,
        COALESCE(pl.likes_count, 0) AS likes_count,
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
    ORDER BY post_matches_distinct.post_created_at DESC
    LIMIT items_per_page
    OFFSET (page_num - 1) * items_per_page;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_posts(TEXT, INTEGER, INTEGER) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION search_posts IS 'Searches for posts across post content, profile stage names, and media titles';
