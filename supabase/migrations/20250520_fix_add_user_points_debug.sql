-- Corriger la fonction add_user_points avec plus de vérifications
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que l'utilisateur existe
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Vérifier que l'utilisateur existe dans profiles
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User ID % not found in profiles', p_user_id;
  END IF;

  -- Log pour le débogage
  RAISE NOTICE 'Updating points for user %: adding % points', p_user_id, p_points;
  
  -- Mettre à jour les points de l'utilisateur avec la clause WHERE
  UPDATE profiles 
  SET points = COALESCE(points, 0) + p_points
  WHERE id = p_user_id;
  
  -- Vérifier que la mise à jour a affecté une ligne
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Update failed for user %', p_user_id;
  END IF;
  
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
