-- Ajouter les points à l'utilisateur spécifié
DO $$
BEGIN
  -- Mettre à jour les points dans la table profiles
  UPDATE profiles 
  SET points = COALESCE(points, 0) + 50
  WHERE id = '2380b68d-d2bb-460a-ba84-2ac15b778e5a';

  -- Ajouter l'entrée dans l'historique des points
  INSERT INTO points_history (
    user_id,
    points_change,
    reason
  ) VALUES (
    '2380b68d-d2bb-460a-ba84-2ac15b778e5a',
    50,
    'Points de démarrage attribués'
  );
END $$;
