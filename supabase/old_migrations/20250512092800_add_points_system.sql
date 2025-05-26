-- Ajouter la colonne points à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Créer la table d'historique des points
CREATE TABLE IF NOT EXISTS points_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    points_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction pour calculer les points initiaux basés sur l'historique
CREATE OR REPLACE FUNCTION calculate_initial_points()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Pour chaque utilisateur
    FOR user_record IN SELECT id FROM profiles
    LOOP
        -- Points de base
        UPDATE profiles SET points = 0 WHERE id = user_record.id;
        
        -- Points pour les médias publiés (+10 par média)
        UPDATE profiles 
        SET points = points + (
            SELECT COUNT(*) * 10 
            FROM medias 
            WHERE user_id = user_record.id
        )
        WHERE id = user_record.id;
        
        -- Points pour les likes reçus (+2 par like)
        UPDATE profiles 
        SET points = points + (
            SELECT COUNT(*) * 2 
            FROM interactions i
            JOIN medias m ON m.id = i.media_id
            WHERE m.user_id = user_record.id 
            AND i.type = 'like'
        )
        WHERE id = user_record.id;
        
        -- Points pour les commentaires reçus (+1 par commentaire)
        UPDATE profiles 
        SET points = points + (
            SELECT COUNT(*) * 1 
            FROM comments c
            JOIN medias m ON m.id = c.media_id
            WHERE m.user_id = user_record.id
        )
        WHERE id = user_record.id;
        
        -- Points pour les challenges gagnés
        -- Note: À adapter selon votre structure de données des challenges
        
        -- Enregistrer dans l'historique
        INSERT INTO points_history (user_id, points_change, reason)
        SELECT 
            user_record.id,
            profiles.points - 1000,
            'Initial points calculation'
        FROM profiles
        WHERE id = user_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Exécuter le calcul initial
SELECT calculate_initial_points();

-- Créer un index sur user_id pour de meilleures performances
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
