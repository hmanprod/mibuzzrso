-- Mise à jour de la fonction add_points_for_like
CREATE OR REPLACE FUNCTION add_points_for_like(p_media_id UUID)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_media_owner_id UUID;
BEGIN
  -- Récupérer l'utilisateur qui like
  SELECT user_id INTO v_user_id
  FROM auth.users
  WHERE id = auth.uid();

  -- Récupérer le propriétaire du média
  SELECT user_id INTO v_media_owner_id
  FROM medias
  WHERE id = p_media_id;

  -- Ajouter les points au propriétaire du média si ce n'est pas déjà fait pour cet utilisateur
  INSERT INTO user_points (user_id, points, source, source_id, source_user_id)
  SELECT 
    v_media_owner_id,
    3,
    'like',
    p_media_id,
    v_user_id
  WHERE NOT EXISTS (
    SELECT 1 
    FROM user_points 
    WHERE user_id = v_media_owner_id 
    AND source = 'like' 
    AND source_id = p_media_id 
    AND source_user_id = v_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
