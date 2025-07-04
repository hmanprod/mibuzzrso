CREATE OR REPLACE FUNCTION get_user_media_with_likes(
  p_current_user_id UUID,
  p_limit INTEGER DEFAULT 12,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  post_id UUID,
  url TEXT,
  type TEXT,
  duration INTEGER,
  thumbnail_url TEXT,
  liked BOOLEAN,
  likes_count BIGINT,
  total_count BIGINT,
  post JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH media_with_likes AS (
    SELECT 
      m.id,
      m.created_at,
      m.post_id,
      m.url,
      m.type,
      m.duration,
      m.thumbnail_url,
      EXISTS (
        SELECT 1 
        FROM media_likes ml 
        WHERE ml.media_id = m.id 
        AND ml.user_id = p_current_user_id
      ) as liked,
      (
        SELECT COUNT(*) 
        FROM media_likes ml 
        WHERE ml.media_id = m.id
      ) as likes_count,
      (
        SELECT jsonb_build_object(
          'id', p.id,
          'title', p.title,
          'content', p.content,
          'user_id', p.user_id
        )
        FROM posts p 
        WHERE p.id = m.post_id
      ) as post,
      COUNT(*) OVER() as total_count
    FROM medias m
    JOIN posts p ON m.post_id = p.id
    WHERE p.user_id = p_current_user_id
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT 
    id,
    created_at,
    post_id,
    url,
    type,
    duration,
    thumbnail_url,
    liked,
    likes_count,
    total_count,
    post
  FROM media_with_likes;
END;
$$;
