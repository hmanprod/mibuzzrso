-- Ajouter les colonnes source et source_id
ALTER TABLE points_history
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_id UUID;

-- Mettre à jour la fonction add_points_for_comment
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

    -- Vérifier si des points ont déjà été attribués pour ce commentaire reçu
    IF EXISTS (
        SELECT 1 FROM points_history
        WHERE source = 'comment_received'
        AND source_id = p_comment_id
    ) THEN
        RETURN FALSE;
    END IF;

    -- Ajouter les points au propriétaire du média
    INSERT INTO points_history (
        user_id,
        points_change,
        source,
        source_id,
        reason
    ) VALUES (
        v_media_owner_id,
        5,
        'comment_received',
        p_comment_id,
        'Commentaire reçu sur le média ' || v_media_id::TEXT
    );

    -- Mettre à jour les points de l'utilisateur
    UPDATE profiles 
    SET points = points + 5
    WHERE id = v_media_owner_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
