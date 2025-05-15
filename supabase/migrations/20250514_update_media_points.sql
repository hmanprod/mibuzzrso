-- Créer une table pour tracer les médias publiés par jour
CREATE TABLE IF NOT EXISTS daily_media_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    upload_date DATE DEFAULT CURRENT_DATE,
    media_id UUID REFERENCES medias(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Un utilisateur ne peut avoir qu'une seule entrée par jour
    UNIQUE(user_id, upload_date)
);

-- Mettre à jour la fonction add_points_for_media
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
