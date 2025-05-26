-- Create function to get media from subscribed users
CREATE OR REPLACE FUNCTION get_media_subscribed(
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
  likes_count BIGINT,
  is_liked BOOLEAN,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH followed_users AS (
    -- Get users that the current user follows
    SELECT following_id
    FROM follows
    WHERE follower_id = p_current_user_id
  ),
  media_with_likes AS (
    -- Get media from followed users with likes count
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
      )::BIGINT AS likes_count,
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
      COUNT(*) OVER() AS total_count
    FROM medias m
    JOIN profiles pr ON m.user_id = pr.id
    WHERE m.user_id IN (SELECT following_id FROM followed_users)
  )
  SELECT *
  FROM media_with_likes
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_media_subscribed TO authenticated;
