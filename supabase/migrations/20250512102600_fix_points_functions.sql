-- Modifier la fonction add_points_for_like pour retirer le paramètre p_user_id inutile
CREATE OR REPLACE FUNCTION add_points_for_like(
  p_media_id UUID
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
