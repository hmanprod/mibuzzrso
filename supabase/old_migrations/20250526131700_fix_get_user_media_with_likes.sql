-- Drop the existing function first
DROP FUNCTION IF EXISTS get_user_media_with_likes(UUID, INTEGER, INTEGER);

-- Create the new function
CREATE OR REPLACE FUNCTION get_user_media_with_likes(
  p_current_user_id UUID,
  p_limit INTEGER DEFAULT 12,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  media_url TEXT,
  media_type TEXT,
  duration INTEGER,
  media_cover_url TEXT,
  liked BOOLEAN,
  likes_count BIGINT,
  total_count BIGINT,
  user_id UUID
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
      m.media_url,
      m.media_type,
      m.duration,
      m.media_cover_url,
      m.user_id,
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
      COUNT(*) OVER() as total_count
    FROM medias m
    WHERE m.user_id = p_current_user_id
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT 
    id,
    created_at,
    media_url,
    media_type,
    duration,
    media_cover_url,
    liked,
    likes_count,
    total_count,
    user_id
  FROM media_with_likes;
END;
$$;
