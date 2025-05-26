-- 1. Trigger pour les likes (+2 points)
CREATE OR REPLACE FUNCTION add_points_on_like()
RETURNS TRIGGER AS $$
BEGIN
    -- Trouver l'utilisateur qui a reçu le like et ajouter les points
    UPDATE profiles
    SET points = points + 2
    WHERE id = (
        SELECT user_id 
        FROM medias 
        WHERE id = NEW.media_id
    );
    
    -- Enregistrer dans l'historique
    INSERT INTO points_history (user_id, points_change, reason)
    SELECT 
        user_id,
        2,
        'Received like on media ' || NEW.media_id
    FROM medias
    WHERE id = NEW.media_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_received
AFTER INSERT ON interactions
FOR EACH ROW
WHEN (NEW.type = 'like')
EXECUTE FUNCTION add_points_on_like();

-- 2. Trigger pour les nouveaux posts/médias (+10 points)
CREATE OR REPLACE FUNCTION add_points_on_post()
RETURNS TRIGGER AS $$
BEGIN
    -- Ajouter les points à l'utilisateur qui a posté
    UPDATE profiles
    SET points = points + 10
    WHERE id = NEW.user_id;
    
    -- Enregistrer dans l'historique
    INSERT INTO points_history (user_id, points_change, reason)
    VALUES (NEW.user_id, 10, 'New media upload');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_media_upload
AFTER INSERT ON medias
FOR EACH ROW
EXECUTE FUNCTION add_points_on_post();

-- 3. Trigger pour la participation aux challenges (+5 points)
CREATE OR REPLACE FUNCTION add_points_on_challenge_participation()
RETURNS TRIGGER AS $$
BEGIN
    -- Ajouter les points à l'utilisateur qui participe
    UPDATE profiles
    SET points = points + 5
    WHERE id = (
        SELECT user_id 
        FROM medias 
        WHERE id = NEW.media_id
    );
    
    -- Enregistrer dans l'historique
    INSERT INTO points_history (user_id, points_change, reason)
    SELECT 
        user_id,
        5,
        'Challenge participation'
    FROM medias
    WHERE id = NEW.media_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_challenge_participation
AFTER INSERT ON challenges_medias
FOR EACH ROW
EXECUTE FUNCTION add_points_on_challenge_participation();
