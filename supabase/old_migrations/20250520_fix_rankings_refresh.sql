-- Corriger la fonction handle_rankings_refresh
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
