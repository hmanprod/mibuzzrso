-- Drop the old function first
DROP FUNCTION IF EXISTS get_media_with_likes;

-- Create the updated function with correct return type
CREATE OR REPLACE FUNCTION get_media_with_likes(
  p_current_user_id UUID,
  p_limit INTEGER,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  media_type media_type,
  media_url TEXT,
  media_public_id TEXT,
  title TEXT,
  author TEXT,
  duration DECIMAL,
  user_id UUID,
  profile JSONB,
  likes BIGINT,
  is_liked BOOLEAN,
  is_followed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.created_at,
    m.media_type,
    m.media_url,
    m.media_public_id,
    m.title,
    m.author,
    m.duration,
    m.user_id,
    jsonb_build_object(
      'id', pr.id,
      'stage_name', pr.stage_name,
      'avatar_url', pr.avatar_url
    ) AS profile,
    COALESCE(
      (SELECT COUNT(*)
      FROM interactions i
      WHERE i.media_id = m.id AND i.type = 'like'),
      0
    )::BIGINT AS likes,
    COALESCE(
      (SELECT EXISTS (
        SELECT 1
        FROM interactions i
        WHERE i.media_id = m.id 
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
        AND f.following_id = m.user_id
      )),
      FALSE
    ) AS is_followed
  FROM medias m
  JOIN profiles pr ON m.user_id = pr.id
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
