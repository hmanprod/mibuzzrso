-- Supprimer les fonctions liées aux weekly rankings
DROP FUNCTION IF EXISTS calculate_weekly_ranking();
DROP FUNCTION IF EXISTS update_ranking_on_points_change();
DROP FUNCTION IF EXISTS update_user_weekly_ranking(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_current_week();

-- Supprimer les wrappers qui incluent le ranking
DROP FUNCTION IF EXISTS add_points_for_like_with_ranking(UUID, UUID);
DROP FUNCTION IF EXISTS add_points_for_comment_with_ranking(UUID);

-- Supprimer les triggers liés aux weekly rankings
DROP TRIGGER IF EXISTS points_update_ranking_trigger ON points_history;

-- Supprimer les index liés aux weekly rankings
DROP INDEX IF EXISTS idx_weekly_rankings_week;

-- Supprimer la table weekly_rankings
DROP TABLE IF EXISTS weekly_rankings;

-- Créer une fonction pour obtenir le classement hebdomadaire directement depuis points_history
CREATE OR REPLACE FUNCTION get_weekly_ranking(p_week_start DATE DEFAULT date_trunc('week', CURRENT_DATE)::DATE)
RETURNS TABLE (
    user_id UUID,
    points_earned BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_points AS (
        SELECT 
            ph.user_id,
            SUM(ph.points_change) as total_points
        FROM points_history ph
        WHERE ph.created_at >= p_week_start
        AND ph.created_at < p_week_start + INTERVAL '7 days'
        GROUP BY ph.user_id
        HAVING SUM(ph.points_change) > 0
    )
    SELECT 
        wp.user_id,
        wp.total_points as points_earned,
        RANK() OVER (ORDER BY wp.total_points DESC) as rank
    FROM weekly_points wp
    INNER JOIN profiles p ON p.id = wp.user_id
    WHERE p.points >= 150;  -- Garder la règle des utilisateurs Bronze+
END;
$$ LANGUAGE plpgsql;

-- Créer un index sur created_at pour optimiser les requêtes de classement
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at);

COMMENT ON FUNCTION get_weekly_ranking IS 
'Retourne le classement hebdomadaire des utilisateurs en se basant sur points_history.
Les utilisateurs doivent avoir au moins 150 points au total et avoir gagné des points pendant la semaine.
Par défaut, retourne le classement de la semaine en cours.';
