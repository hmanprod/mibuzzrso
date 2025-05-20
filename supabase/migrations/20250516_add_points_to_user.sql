-- Ajouter les points à l'utilisateur spécifié
DO $$
BEGIN
  -- Mettre à jour les points dans la table profiles
  UPDATE profiles 
  SET points = COALESCE(points, 0) + 150
  WHERE id = 'c4ca416b-b666-45c1-8830-0730b20e472d';

  -- Ajouter l'entrée dans l'historique des points
  INSERT INTO points_history (
    user_id,
    points_change,
    reason
  ) VALUES (
    'c4ca416b-b666-45c1-8830-0730b20e472d',
    150,
    'Points de démarrage attribués'
  );
END $$;
