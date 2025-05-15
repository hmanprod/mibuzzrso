-- Créer une table pour tracer les likes uniques
CREATE TABLE IF NOT EXISTS unique_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    media_id UUID REFERENCES medias(id),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(media_id, user_id)
);

-- Mettre à jour la fonction add_points_for_like
CREATE OR REPLACE FUNCTION add_points_for_like(
    p_media_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_media_owner_id UUID;
BEGIN
    -- Vérifier si le média existe et obtenir son propriétaire
    SELECT user_id INTO v_media_owner_id
    FROM medias
    WHERE id = p_media_id;
    
    IF v_media_owner_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Essayer d'insérer dans unique_likes (échouera si déjà liké)
    BEGIN
        INSERT INTO unique_likes (media_id, user_id)
        VALUES (p_media_id, p_user_id);

        -- Si l'insertion réussit, ajouter les points
        PERFORM add_user_points(
            v_media_owner_id,
            3,
            'Like unique reçu sur le média ' || p_media_id::TEXT
        );

        RETURN TRUE;
    EXCEPTION WHEN unique_violation THEN
        -- Le like existe déjà, ne rien faire
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;
