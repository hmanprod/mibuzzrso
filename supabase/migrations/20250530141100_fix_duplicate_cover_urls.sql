-- Mise à NULL des media_cover_url qui sont identiques à media_url
UPDATE medias
SET media_cover_url = NULL
WHERE media_cover_url = media_url;

-- Mise à NULL des mediaCoverUrl dans les posts qui sont identiques à mediaUrl
UPDATE posts
SET media_cover_url = "test"
WHERE media_cover_url = media_url;

-- Log le nombre de mises à jour effectuées
DO $$
DECLARE
    media_count INTEGER;
    post_count INTEGER;
BEGIN
    GET DIAGNOSTICS media_count = ROW_COUNT;
    RAISE NOTICE 'Nombre de médias mis à jour : %', media_count;
    
    GET DIAGNOSTICS post_count = ROW_COUNT;
    RAISE NOTICE 'Nombre de posts mis à jour : %', post_count;
END $$;
