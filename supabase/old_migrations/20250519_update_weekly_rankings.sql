-- Fonction utilitaire pour obtenir les dates de la semaine
CREATE OR REPLACE FUNCTION get_current_week()
RETURNS TABLE(week_start DATE, week_end DATE) AS $$
BEGIN
    RETURN QUERY SELECT 
        date_trunc('week', CURRENT_DATE)::DATE,
        (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le classement d'un utilisateur
CREATE OR REPLACE FUNCTION update_user_weekly_ranking(p_user_id UUID, p_points INTEGER)
RETURNS void AS $$
DECLARE
    v_week_start DATE;
    v_week_end DATE;
    v_current_points INTEGER;
    v_new_rank INTEGER;
BEGIN
    -- Vérifier si l'utilisateur a au moins 150 points
    SELECT points INTO v_current_points
    FROM profiles
    WHERE id = p_user_id;

    IF v_current_points < 150 THEN
        RETURN;
    END IF;

    -- Obtenir les dates de la semaine
    SELECT * FROM get_current_week() INTO v_week_start, v_week_end;

    -- Mettre à jour ou insérer l'entrée dans weekly_rankings
    INSERT INTO weekly_rankings (
        user_id,
        week_start,
        week_end,
        points_earned,
        rank
    )
    VALUES (
        p_user_id,
        v_week_start,
        v_week_end,
        p_points,
        1  -- Rang temporaire
    )
    ON CONFLICT (user_id, week_start)
    DO UPDATE SET
        points_earned = weekly_rankings.points_earned + p_points;

    -- Recalculer les rangs pour tous les utilisateurs de la semaine
    WITH ranked_users AS (
        SELECT 
            user_id,
            RANK() OVER (ORDER BY points_earned DESC) as new_rank
        FROM weekly_rankings
        WHERE week_start = v_week_start
    )
    UPDATE weekly_rankings wr
    SET rank = ru.new_rank
    FROM ranked_users ru
    WHERE wr.user_id = ru.user_id
    AND wr.week_start = v_week_start;
END;
$$ LANGUAGE plpgsql;
