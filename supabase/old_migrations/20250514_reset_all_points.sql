-- Réinitialiser tous les points à 0
UPDATE profiles SET points = 0;

-- Vider l'historique des points
TRUNCATE points_history;

-- Vider la table des likes uniques pour repartir de zéro
TRUNCATE unique_likes;
