-- Corriger la fonction add_points_for_media pour gérer correctement les daily_media_uploads
CREATE OR REPLACE FUNCTION add_points_for_media(
    p_media_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_current_date DATE;
BEGIN
    -- Obtenir l'utilisateur qui a posté le média
    SELECT user_id INTO v_user_id
    FROM medias
    WHERE id = p_media_id;
    
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Obtenir la date courante
    v_current_date := CURRENT_DATE;

    -- Essayer d'insérer dans daily_media_uploads
    BEGIN
        INSERT INTO daily_media_uploads (user_id, media_id, upload_date)
        VALUES (v_user_id, p_media_id, v_current_date);

        -- Si l'insertion réussit, ajouter les points
        PERFORM add_user_points(
            v_user_id,
            10,
            'Publication du média ' || p_media_id::TEXT || ' (limite journalière)'
        );

        RETURN TRUE;
    EXCEPTION WHEN unique_violation THEN
        -- L'utilisateur a déjà publié un média aujourd'hui
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;
