-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS on_like_received ON interactions;
DROP TRIGGER IF EXISTS on_media_upload ON medias;
DROP TRIGGER IF EXISTS on_challenge_participation ON challenges_medias;

-- Supprimer les fonctions des triggers
DROP FUNCTION IF EXISTS add_points_on_like;
DROP FUNCTION IF EXISTS add_points_on_post;
DROP FUNCTION IF EXISTS add_points_on_challenge_participation;
