-- Fonction pour supprimer toutes les interactions
CREATE OR REPLACE FUNCTION delete_all_interactions()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM interactions;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour supprimer tous les daily_comments
CREATE OR REPLACE FUNCTION delete_all_daily_comments()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM daily_comments;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour supprimer tous les commentaires
CREATE OR REPLACE FUNCTION delete_all_comments()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM comments;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour supprimer tous les unique_likes
CREATE OR REPLACE FUNCTION delete_all_unique_likes()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM unique_likes;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour supprimer tous les daily_media_uploads
CREATE OR REPLACE FUNCTION delete_all_daily_media_uploads()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM daily_media_uploads;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour supprimer tous les post_medias
CREATE OR REPLACE FUNCTION delete_all_post_medias()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM post_medias;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour supprimer tous les posts
CREATE OR REPLACE FUNCTION delete_all_posts()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM posts;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour supprimer tous les medias
CREATE OR REPLACE FUNCTION delete_all_medias()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM medias;
END;
$$ LANGUAGE plpgsql;
