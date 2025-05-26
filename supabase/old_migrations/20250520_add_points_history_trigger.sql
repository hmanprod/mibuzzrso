-- Créer une table pour suivre le dernier rafraîchissement
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
  SET is_refreshing = true;
  
  -- Rafraîchir la vue
  PERFORM refresh_weekly_rankings();
  
  -- Mettre à jour le timestamp et réinitialiser le flag
  UPDATE weekly_rankings_refresh_state 
  SET last_refresh = now(),
      is_refreshing = false;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur points_history
DROP TRIGGER IF EXISTS trigger_refresh_rankings ON points_history;
CREATE TRIGGER trigger_refresh_rankings
  AFTER INSERT OR UPDATE OR DELETE
  ON points_history
  FOR EACH STATEMENT
  EXECUTE FUNCTION handle_rankings_refresh();XECUTE FUNCTION handle_rankings_refresh();

-- Commentaire explicatif
COMMENT ON TRIGGER trigger_refresh_rankings ON points_history IS 
  'Rafraîchit la vue weekly_rankings_view après chaque modification de points_history, avec un délai minimum de 10 secondes entre les rafraîchissements.';
