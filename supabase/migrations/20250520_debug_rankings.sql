-- Vérifier les utilisateurs avec plus de 150 points
SELECT id, stage_name, points 
FROM profiles 
WHERE points >= 150;

-- Vérifier les entrées dans points_history pour cette semaine
WITH week_bounds AS (
  SELECT
    date_trunc('week', now())::date as week_start,
    (date_trunc('week', now()) + interval '6 days' + interval '23 hours 59 minutes 59 seconds')::timestamp as week_end
)
SELECT 
  ph.user_id,
  p.stage_name,
  p.points,
  SUM(ph.points_change) as points_earned
FROM points_history ph
INNER JOIN profiles p ON p.id = ph.user_id
CROSS JOIN week_bounds wb
WHERE 
  ph.created_at >= wb.week_start
  AND ph.created_at <= wb.week_end
  AND p.points >= 150
GROUP BY ph.user_id, p.stage_name, p.points;

-- Vérifier le contenu actuel de la vue matérialisée
SELECT * FROM weekly_rankings_view;
