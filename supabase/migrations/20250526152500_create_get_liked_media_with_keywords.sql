-- Create function to get liked media with keywords search
CREATE OR REPLACE FUNCTION get_liked_media_with_keywords(
  p_current_user_id UUID,
  p_keywords TEXT,
  p_limit INTEGER,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  title TEXT,
  media_url TEXT,
  media_type VARCHAR,
  duration NUMERIC(10,2),
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
  WITH liked_media AS (
    -- Get media IDs that the current user has liked
    SELECT media_id
    FROM interactions i
    WHERE i.user_id = p_current_user_id 
    AND i.type = 'like'
  ),
  media_counts AS (
    SELECT COUNT(*) as total
    FROM medias m
    WHERE m.id IN (SELECT media_id FROM liked_media)
    AND (
      m.title ILIKE '%' || p_keywords || '%'
    )
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
    TRUE as is_liked, -- Always true since these are liked media
    EXISTS (
      SELECT 1 FROM public.follows f 
      WHERE f.follower_id = p_current_user_id 
      AND f.following_id = m.user_id
    ) as is_followed,
    mc.total as total_count
  FROM medias m
  CROSS JOIN media_counts mc
  LEFT JOIN profiles p ON m.user_id = p.id
  LEFT JOIN interactions l ON l.media_id = m.id AND l.type = 'like'
  WHERE m.id IN (SELECT media_id FROM liked_media)
  AND (
    m.title ILIKE '%' || p_keywords || '%'
  )
  GROUP BY m.id, m.created_at, m.title, m.media_url, m.media_type, 
           m.duration, m.media_public_id, m.media_cover_url, m.user_id,
           p.id, p.stage_name, p.avatar_url, p.pseudo_url, mc.total
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
