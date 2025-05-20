-- Supprimer les entrées de points_history
DELETE FROM points_history 
WHERE id IN (
  '4e695d72-aecc-4419-a621-b68e7a90ab86',
  '3430d584-adb5-42c9-9785-c75ddbdb26c6'
);

-- Soustraire 300 points aux utilisateurs concernés
UPDATE profiles 
SET points = GREATEST(points - 300, 0)  -- Utiliser GREATEST pour éviter les points négatifs
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM points_history 
  WHERE id IN (
    '4e695d72-aecc-4419-a621-b68e7a90ab86',
    '3430d584-adb5-42c9-9785-c75ddbdb26c6'
  )
);

-- Rafraîchir la vue des classements
SELECT refresh_weekly_rankings();
