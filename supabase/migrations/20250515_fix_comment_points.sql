-- Mettre à jour la fonction pour utiliser add_user_points
CREATE OR REPLACE FUNCTION add_points_for_comment(
    p_comment_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_media_owner_id UUID;
    v_comment_text TEXT;
    v_media_id UUID;
BEGIN
    -- Récupérer le texte du commentaire et le média associé
    SELECT content, media_id INTO v_comment_text, v_media_id
    FROM comments
    WHERE id = p_comment_id;

    IF v_comment_text IS NULL OR v_media_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Vérifier si le commentaire fait plus de 10 caractères
    IF LENGTH(TRIM(v_comment_text)) <= 10 THEN
        RETURN FALSE;
    END IF;

    -- Récupérer le propriétaire du média
    SELECT user_id INTO v_media_owner_id
    FROM medias
    WHERE id = v_media_id;

    IF v_media_owner_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- -- Vérifier si des points ont déjà été attribués pour ce commentaire reçu
    -- IF EXISTS (
    --     SELECT 1 FROM points_history
    --     WHERE reason LIKE 'Commentaire reçu%'
    --     AND reason LIKE '%' || p_comment_id::TEXT || '%'
    -- ) THEN
    --     RETURN FALSE;
    -- END IF;

    -- Ajouter les points au propriétaire du média via add_user_points
    PERFORM add_user_points(
        v_media_owner_id,
        5,
        'Commentaire reçu (ID: ' || p_comment_id::TEXT || ')'
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
