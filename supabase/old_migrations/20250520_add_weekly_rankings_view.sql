-- Créer une vue matérialisée pour le classement hebdomadaire
CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_rankings_view AS
WITH week_bounds AS (
  SELECT
    date_trunc('week', now())::date as week_start,
    (date_trunc('week', now()) + interval '6 days' + interval '23 hours 59 minutes 59 seconds')::timestamp as week_end
),
weekly_points AS (
  SELECT 
    ph.user_id,
    p.stage_name,
    p.avatar_url,
    p.points as total_points,
    SUM(ph.points_change) as points_earned,
    RANK() OVER (ORDER BY SUM(ph.points_change) DESC) as rank
  FROM points_history ph
  INNER JOIN profiles p ON p.id = ph.user_id
  CROSS JOIN week_bounds wb
  WHERE 
    ph.created_at >= wb.week_start
    AND ph.created_at <= wb.week_end
    AND p.points >= 150  -- Uniquement les utilisateurs Bronze+
  GROUP BY 
    ph.user_id,
    p.stage_name,
    p.avatar_url,
    p.points
  HAVING SUM(ph.points_change) > 0  -- Uniquement les utilisateurs actifs cette semaine
)
SELECT * FROM weekly_points;

-- Index unique requis pour le rafraîchissement concurrent
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_rankings_view_user_id ON weekly_rankings_view(user_id);

-- Index secondaire pour optimiser les requêtes par rang
CREATE INDEX IF NOT EXISTS idx_weekly_rankings_view_rank ON weekly_rankings_view(rank);

-- Fonction pour rafraîchir la vue chaque semaine
CREATE OR REPLACE FUNCTION refresh_weekly_rankings()
RETURNS void AS $$
BEGIN
  -- Rafraîchir la vue de manière non concurrente pour le premier chargement
  -- car le rafraîchissement concurrent nécessite des données existantes
  IF NOT EXISTS (SELECT 1 FROM weekly_rankings_view LIMIT 1) THEN
    REFRESH MATERIALIZED VIEW weekly_rankings_view;
  ELSE
    -- Rafraîchir la vue de manière concurrente (ne bloque pas les lectures)
    REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_rankings_view;
  END IF;

  -- Analyser la vue pour mettre à jour les statistiques
  ANALYZE weekly_rankings_view;
END;
$$ LANGUAGE plpgsql;

-- Rafraîchir la vue pour la première fois
SELECT refresh_weekly_rankings();

-- Note: Le job cron doit être créé manuellement dans la console Supabase
-- Utiliser l'interface de Supabase Database > Database Triggers pour créer un
-- scheduled task qui exécute refresh_weekly_rankings() tous les lundis à 00:00
