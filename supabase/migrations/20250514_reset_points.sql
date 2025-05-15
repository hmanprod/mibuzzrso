-- Réinitialisation des points en soustrayant 1000 points à tous les utilisateurs
UPDATE profiles
SET points = GREATEST(0, points - 1000);

-- Mise à jour de la table user_points pour refléter le nouveau système
DELETE FROM user_points 
WHERE source = 'initial_points' 
AND points = 1000;
