-- Table pour suivre les commentaires quotidiens
CREATE TABLE IF NOT EXISTS daily_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    comment_date DATE DEFAULT CURRENT_DATE,
    comment_id UUID REFERENCES comments(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser la recherche des commentaires par jour
CREATE INDEX IF NOT EXISTS idx_daily_comments_user_date 
ON daily_comments(user_id, comment_date);

-- Fonction pour ajouter des points pour avoir commenté
CREATE OR REPLACE FUNCTION add_points_for_commenting(
    p_comment_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_comment_count INTEGER;
    v_current_date DATE;
BEGIN
    -- Obtenir la date courante
    v_current_date := CURRENT_DATE;

    -- Compter les commentaires de l'utilisateur aujourd'hui
    SELECT COUNT(*) INTO v_comment_count
    FROM daily_comments
    WHERE user_id = p_user_id
    AND comment_date = v_current_date;

    -- Vérifier si l'utilisateur n'a pas déjà atteint la limite journalière
    IF v_comment_count >= 3 THEN
        RETURN FALSE;
    END IF;

    -- Enregistrer le commentaire dans daily_comments
    INSERT INTO daily_comments (user_id, comment_id, comment_date)
    VALUES (p_user_id, p_comment_id, v_current_date);

    -- Ajouter les points à l'utilisateur qui commente
    PERFORM add_user_points(
        p_user_id,
        2,
        'Commentaire créé (ID: ' || p_comment_id::TEXT || ')'
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
