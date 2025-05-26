-- Supprimer d'abord la fonction existante
DROP FUNCTION IF EXISTS refresh_weekly_rankings();

-- Recréer la fonction avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION refresh_weekly_rankings()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rafraîchir la vue de manière non concurrente pour le premier chargement
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

-- Donner les permissions d'exécution à tous les rôles
GRANT EXECUTE ON FUNCTION refresh_weekly_rankings() TO authenticated, anon, service_role;

-- Changer le propriétaire de la vue matérialisée à postgres
ALTER MATERIALIZED VIEW IF EXISTS weekly_rankings_view OWNER TO postgres;

-- Commentaire explicatif
COMMENT ON FUNCTION refresh_weekly_rankings() IS 
  'Rafraîchit la vue matérialisée weekly_rankings_view. SECURITY DEFINER permet l''exécution avec les privilèges du propriétaire.';
