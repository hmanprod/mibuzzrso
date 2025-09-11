-- Migration pour ajouter la contrainte foreign key manquante entre comments et medias
-- Créé le 2025-09-08

BEGIN;

-- Vérifier et créer la clé primaire sur medias.id si elle n'existe pas
ALTER TABLE public.medias 
ADD CONSTRAINT medias_pkey PRIMARY KEY (id);

-- Ajouter la contrainte foreign key entre comments.media_id et medias.id
ALTER TABLE public.comments 
ADD CONSTRAINT comments_media_id_fkey 
FOREIGN KEY (media_id) REFERENCES public.medias (id) ON DELETE CASCADE;

-- Ajouter l'index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_comments_media_id
ON public.comments USING btree (media_id);

COMMIT;
