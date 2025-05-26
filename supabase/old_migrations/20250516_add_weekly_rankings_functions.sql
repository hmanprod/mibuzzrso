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

-- Wrapper pour add_points_for_like
CREATE OR REPLACE FUNCTION add_points_for_like_with_ranking(
    p_media_id UUID,
    p_user_id UUID
)
RETURNS void AS $$
DECLARE
    v_points_added INTEGER;
BEGIN
    -- Appeler la fonction existante et récupérer les points ajoutés
    PERFORM add_points_for_like(p_media_id, p_user_id);
    
    -- Récupérer les points qui ont été ajoutés
    SELECT points_change INTO v_points_added
    FROM points_history
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Mettre à jour le classement
    IF v_points_added > 0 THEN
        PERFORM update_user_weekly_ranking(p_user_id, v_points_added);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Wrapper pour add_points_for_comment
CREATE OR REPLACE FUNCTION add_points_for_comment_with_ranking(
    p_comment_id UUID
)
RETURNS void AS $$
DECLARE
    v_points_added INTEGER;
    v_user_id UUID;
BEGIN
    -- Appeler la fonction existante
    PERFORM add_points_for_comment(p_comment_id);
    
    -- Récupérer les points qui ont été ajoutés et l'utilisateur
    SELECT points_change, user_id INTO v_points_added, v_user_id
    FROM points_history
    WHERE reason LIKE 'Commentaire reçu%' || p_comment_id::TEXT
    ORDER BY created_at DESC
    LIMIT 1;

    -- Mettre à jour le classement
    IF v_points_added > 0 THEN
        PERFORM update_user_weekly_ranking(v_user_id, v_points_added);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Wrapper pour add_points_for_commenting
CREATE OR REPLACE FUNCTION add_points_for_commenting_with_ranking(
    p_comment_id UUID,
    p_user_id UUID
)
RETURNS void AS $$
DECLARE
    v_points_added INTEGER;
BEGIN
    -- Appeler la fonction existante
    PERFORM add_points_for_commenting(p_comment_id, p_user_id);
    
    -- Récupérer les points qui ont été ajoutés
    SELECT points_change INTO v_points_added
    FROM points_history
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Mettre à jour le classement
    IF v_points_added > 0 THEN
        PERFORM update_user_weekly_ranking(p_user_id, v_points_added);
    END IF;
END;
$$ LANGUAGE plpgsql;
