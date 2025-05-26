-- Ajout du type challenge_participation et de la colonne challenge_id
ALTER TYPE post_type ADD VALUE IF NOT EXISTS 'challenge_participation';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES challenges(id);

-- Création d'une fonction pour migrer les participations
CREATE OR REPLACE FUNCTION migrate_challenge_participations()
RETURNS void AS $$
BEGIN
  -- Insérer les participations dans posts
  INSERT INTO posts (
    title,
    description,
    type,
    challenge_id,
    user_id,
    created_at,
    updated_at
  )
  SELECT 
    c.title as title,
    'Participation au challenge' as description,
    'challenge_participation' as type,
    cp.challenge_id,
    cp.user_id,
    cp.created_at,
    cp.updated_at
  FROM challenge_participations cp
  JOIN challenges c ON c.id = cp.challenge_id
  WHERE NOT EXISTS (
    SELECT 1 FROM posts p 
    WHERE p.challenge_id = cp.challenge_id 
    AND p.user_id = cp.user_id
  );

  -- Migrer les médias associés
  INSERT INTO post_medias (
    post_id,
    media_id,
    position,
    created_at,
    updated_at
  )
  SELECT 
    p.id as post_id,
    cp.media_id,
    0 as position,
    cp.created_at,
    cp.updated_at
  FROM challenge_participations cp
  JOIN posts p ON p.challenge_id = cp.challenge_id AND p.user_id = cp.user_id
  WHERE p.type = 'challenge_participation'
  AND NOT EXISTS (
    SELECT 1 FROM post_medias pm 
    WHERE pm.post_id = p.id 
    AND pm.media_id = cp.media_id
  );
END;
$$ LANGUAGE plpgsql;

-- Exécuter la migration
SELECT migrate_challenge_participations();

-- Supprimer l'ancienne table (à faire une fois que tout est vérifié)
-- DROP TABLE challenge_participations;
