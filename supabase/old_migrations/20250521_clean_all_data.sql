-- Désactiver temporairement les contraintes de clé étrangère
SET session_replication_role = 'replica';

-- 1. Supprimer les interactions
TRUNCATE TABLE interactions CASCADE;

-- 2. Supprimer les daily_comments
TRUNCATE TABLE daily_comments CASCADE;

-- 3. Supprimer les commentaires
TRUNCATE TABLE comments CASCADE;

-- 4. Supprimer les unique_likes
TRUNCATE TABLE unique_likes CASCADE;

-- 5. Supprimer les daily_media_uploads
TRUNCATE TABLE daily_media_uploads CASCADE;

-- 6. Supprimer les liens posts-médias
TRUNCATE TABLE posts_medias CASCADE;

-- 7. Supprimer les posts
TRUNCATE TABLE posts CASCADE;

-- 8. Supprimer les médias
TRUNCATE TABLE medias CASCADE;

-- Réactiver les contraintes de clé étrangère
SET session_replication_role = 'origin';

-- Rafraîchir les classements
SELECT refresh_weekly_rankings();
