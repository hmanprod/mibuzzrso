-- Create a function to get top interacting post owners
CREATE OR REPLACE FUNCTION get_top_interacting_users(limit_count integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  stage_name text,
  full_name text,
  avatar_url text,
  label text,
  interaction_score float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,  -- On garde bien p.id comme identifiant unique de l'utilisateur
    p.stage_name,
    CASE 
      WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL THEN p.first_name || ' ' || p.last_name
      WHEN p.first_name IS NOT NULL THEN p.first_name
      WHEN p.last_name IS NOT NULL THEN p.last_name
      ELSE NULL
    END AS full_name,
    p.avatar_url,
    p.label,
    SUM(
      CASE 
        WHEN i.type = 'like' THEN 1
        WHEN i.type = 'share' THEN 3
        WHEN i.type = 'save' THEN 2
        WHEN i.type = 'comment_like' THEN 1
        WHEN i.type = 'read' THEN 0.5
        WHEN i.type = 'comment' THEN 2
        ELSE 0
      END
    )::float AS interaction_score
  FROM 
    interactions i
  JOIN 
    posts po ON i.post_id = po.id  -- Associe l'interaction au post concerné
  JOIN 
    profiles p ON po.user_id = p.id  -- Récupère l'auteur du post
  GROUP BY 
    p.id, p.stage_name, p.first_name, p.last_name, p.avatar_url, p.label
  ORDER BY 
    interaction_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;