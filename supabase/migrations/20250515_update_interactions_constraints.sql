-- Supprimer l'ancien index qui empêche les commentaires multiples
DROP INDEX IF EXISTS public.idx_unique_user_media_interaction;

-- Créer un nouvel index qui exclut les commentaires de la contrainte d'unicité
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_media_interaction 
ON public.interactions 
USING btree (user_id, media_id, type) 
WHERE (
    media_id IS NOT NULL 
    AND type <> 'read'::interaction_type 
    AND type <> 'comment'::interaction_type
);

-- Créer un index normal (non-unique) pour les commentaires
CREATE INDEX IF NOT EXISTS idx_user_media_comments
ON public.interactions (user_id, media_id)
WHERE (
    media_id IS NOT NULL 
    AND type = 'comment'::interaction_type
);
