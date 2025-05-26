-- Corriger la fonction add_user_points
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Mettre à jour les points de l'utilisateur avec la clause WHERE
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
