-- Liste des utilisateurs à nettoyer
create table if not exists public.users_to_clean (
  user_id uuid not null,
  name text null,
  constraint users_to_clean_pkey primary key (user_id),
  constraint users_to_clean_user_id_key unique (user_id)
) TABLESPACE pg_default;

-- Vider la table users_to_clean pour éviter les doublons
TRUNCATE TABLE users_to_clean;

-- Insérer l'utilisateur à nettoyer
INSERT INTO users_to_clean (user_id, name) VALUES
    ('c4ca416b-b666-45c1-8830-0730b20e472d', 'Ronal');
    -- ('2380b68d-d2bb-460a-ba84-2ac15b778e5a', 'Ronal'),
    -- ('15e035de-9c9b-4b54-92ce-a036d17a351e', 'Ronal'),
    -- ('a9343b56-87ee-4e7a-9585-195380330638', 'Ronal'),
    -- ('582cc679-61ef-4c5d-823e-a228a369b00e', 'Ronal');

-- Commencer une transaction
BEGIN;

-- 1. Supprimer les interactions liées aux posts des utilisateurs
DELETE FROM interactions i
WHERE i.post_id IN (
    SELECT p.id 
    FROM posts p
    WHERE p.user_id IN (SELECT user_id FROM users_to_clean)
);

-- 2. Supprimer les interactions liées aux commentaires des utilisateurs
DELETE FROM interactions i
WHERE i.comment_id IN (
    SELECT c.id 
    FROM comments c
    WHERE c.user_id IN (SELECT user_id FROM users_to_clean)
);

-- 3. Supprimer les interactions liées aux médias des utilisateurs
DELETE FROM interactions i
WHERE i.media_id IN (
    SELECT m.id 
    FROM medias m
    WHERE m.user_id IN (SELECT user_id FROM users_to_clean)
);

-- 4. Supprimer les daily_comments des utilisateurs
DELETE FROM daily_comments dc
WHERE dc.user_id IN (SELECT user_id FROM users_to_clean)
OR dc.comment_id IN (
    SELECT c.id
    FROM comments c
    WHERE c.user_id IN (SELECT user_id FROM users_to_clean)
);

-- 5. Supprimer les commentaires sur les médias des utilisateurs
DELETE FROM comments c
WHERE c.media_id IN (
    SELECT m.id 
    FROM medias m
    WHERE m.user_id IN (SELECT user_id FROM users_to_clean)
);

-- 6. Supprimer les liens posts-médias
DELETE FROM posts_medias pm
WHERE pm.post_id IN (
    SELECT p.id 
    FROM posts p
    WHERE p.user_id IN (SELECT user_id FROM users_to_clean)
) OR pm.media_id IN (
    SELECT m.id 
    FROM medias m
    WHERE m.user_id IN (SELECT user_id FROM users_to_clean)
);

-- 7. Supprimer les unique_likes
DELETE FROM unique_likes ul
WHERE ul.user_id IN (SELECT user_id FROM users_to_clean)
OR ul.media_id IN (
    SELECT m.id
    FROM medias m
    WHERE m.user_id IN (SELECT user_id FROM users_to_clean)
);

-- 8. Supprimer les daily_media_uploads
DELETE FROM daily_media_uploads dmu
WHERE dmu.user_id IN (SELECT user_id FROM users_to_clean)
OR dmu.media_id IN (
    SELECT m.id
    FROM medias m
    WHERE m.user_id IN (SELECT user_id FROM users_to_clean)
);

-- 9. Supprimer les médias
DELETE FROM medias m
WHERE m.user_id IN (SELECT user_id FROM users_to_clean);

-- 10. Supprimer les posts
DELETE FROM posts p
WHERE p.user_id IN (SELECT user_id FROM users_to_clean);

-- Rafraîchir les classements
SELECT refresh_weekly_rankings();

-- Valider la transaction
COMMIT;
