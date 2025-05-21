    -- Donner les permissions nécessaires sur la vue matérialisée
    GRANT ALL PRIVILEGES ON weekly_rankings_view TO postgres, authenticated, anon, service_role;

    -- Donner les permissions sur la fonction de rafraîchissement
    GRANT EXECUTE ON FUNCTION refresh_weekly_rankings() TO postgres, authenticated, anon, service_role;

    -- Donner les permissions sur la table de suivi des rafraîchissements
    GRANT ALL PRIVILEGES ON weekly_rankings_refresh_state TO postgres, authenticated, anon, service_role;

    -- S'assurer que la vue est initialement rafraîchie avec les bonnes permissions
    ALTER MATERIALIZED VIEW weekly_rankings_view OWNER TO postgres;

    -- Rafraîchir la vue une fois avec les nouvelles permissions
    SELECT refresh_weekly_rankings();
