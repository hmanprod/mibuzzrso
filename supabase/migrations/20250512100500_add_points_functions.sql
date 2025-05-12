-- Fonction pour ajouter des points à un utilisateur
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Mettre à jour les points de l'utilisateur
  UPDATE profiles 
  SET points = COALESCE(points, 0) + p_points
  WHERE id = p_user_id;
  
  -- Enregistrer dans l'historique
  INSERT INTO points_history (
    user_id,
    points_change,
    reason
  ) VALUES (
    p_user_id,
    p_points,
    p_reason
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter des points pour un like
CREATE OR REPLACE FUNCTION add_points_for_like(
  p_media_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_media_owner_id UUID;
BEGIN
  -- Vérifier si le média existe et obtenir son propriétaire
  SELECT user_id INTO v_media_owner_id
  FROM medias
  WHERE id = p_media_id;
  
  IF v_media_owner_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Ajouter les points au propriétaire du média
  PERFORM add_user_points(
    v_media_owner_id,
    2,
    'Like reçu sur le média ' || p_media_id::TEXT
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter des points pour un nouveau média
CREATE OR REPLACE FUNCTION add_points_for_media(
  p_media_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtenir l'utilisateur qui a posté le média
  SELECT user_id INTO v_user_id
  FROM medias
  WHERE id = p_media_id;
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Ajouter les points
  PERFORM add_user_points(
    v_user_id,
    10,
    'Nouveau média posté'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter des points pour une participation à un challenge
CREATE OR REPLACE FUNCTION add_points_for_challenge_participation(
  p_media_id UUID,
  p_challenge_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtenir l'utilisateur qui participe
  SELECT user_id INTO v_user_id
  FROM medias
  WHERE id = p_media_id;
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Ajouter les points
  PERFORM add_user_points(
    v_user_id,
    5,
    'Participation au challenge ' || p_challenge_id::TEXT
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
