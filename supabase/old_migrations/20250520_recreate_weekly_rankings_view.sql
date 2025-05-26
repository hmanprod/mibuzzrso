-- Supprimer d'abord les objets existants
DROP MATERIALIZED VIEW IF EXISTS weekly_rankings_view;
DROP FUNCTION IF EXISTS refresh_weekly_rankings();

-- Recréer la vue matérialisée en tant que postgres
SET ROLE postgres;

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
CREATE INDEX IF NOT EXISTS idx_weekly_rankings_view_rank ON weekly_rankings_view(rank);

-- Fonction pour rafraîchir la vue chaque semaine
CREATE OR REPLACE FUNCTION refresh_weekly_rankings()
RETURNS void AS $$
BEGIN
  -- Rafraîchir la vue de manière non concurrente pour le premier chargement
  IF NOT EXISTS (SELECT 1 FROM weekly_rankings_view LIMIT 1) THEN
    REFRESH MATERIALIZED VIEW weekly_rankings_view;
  ELSE
    -- Rafraîchir la vue de manière concurrente
    REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_rankings_view;
  END IF;

  -- Analyser la vue pour mettre à jour les statistiques
  ANALYZE weekly_rankings_view;
END;
$$ LANGUAGE plpgsql;

-- Créer la table de suivi des rafraîchissements si elle n'existe pas
CREATE TABLE IF NOT EXISTS weekly_rankings_refresh_state (
  last_refresh timestamp with time zone,
  is_refreshing boolean DEFAULT false
);

-- Insérer une ligne initiale si la table est vide
INSERT INTO weekly_rankings_refresh_state (last_refresh, is_refreshing)
SELECT now(), false
WHERE NOT EXISTS (SELECT 1 FROM weekly_rankings_refresh_state);

-- Fonction pour gérer le rafraîchissement avec un délai minimum
CREATE OR REPLACE FUNCTION handle_rankings_refresh()
RETURNS trigger AS $$
DECLARE
  min_refresh_interval interval := '10 seconds'::interval;
  current_state record;
BEGIN
  -- Récupérer l'état actuel
  SELECT * INTO current_state FROM weekly_rankings_refresh_state LIMIT 1;
  
  -- Si un rafraîchissement est déjà en cours, sortir
  IF current_state.is_refreshing THEN
    RETURN NULL;
  END IF;
  
  -- Si le dernier rafraîchissement est trop récent, sortir
  IF current_state.last_refresh + min_refresh_interval > now() THEN
    RETURN NULL;
  END IF;
  
  -- Marquer comme en cours de rafraîchissement
  UPDATE weekly_rankings_refresh_state 
  SET is_refreshing = true
  WHERE last_refresh = current_state.last_refresh
  AND is_refreshing = current_state.is_refreshing;
  
  -- Rafraîchir la vue
  PERFORM refresh_weekly_rankings();
  
  -- Mettre à jour le timestamp et réinitialiser le flag
  UPDATE weekly_rankings_refresh_state 
  SET last_refresh = now(),
      is_refreshing = false
  WHERE is_refreshing = true;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur points_history
DROP TRIGGER IF EXISTS trigger_refresh_rankings ON points_history;
CREATE TRIGGER trigger_refresh_rankings
  AFTER INSERT OR UPDATE OR DELETE
  ON points_history
  FOR EACH STATEMENT
  EXECUTE FUNCTION handle_rankings_refresh();

-- Donner les permissions nécessaires
GRANT ALL PRIVILEGES ON weekly_rankings_view TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION refresh_weekly_rankings() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION handle_rankings_refresh() TO authenticated, anon, service_role;
GRANT ALL PRIVILEGES ON weekly_rankings_refresh_state TO authenticated, anon, service_role;

-- Rafraîchir la vue pour la première fois
SELECT refresh_weekly_rankings();

-- Revenir au rôle par défaut
RESET ROLE;
