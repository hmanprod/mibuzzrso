-- Migration pour corriger les clés primaires manquantes et ajouter le type 'share'
-- Créé le 2025-09-08

BEGIN;

-- Ajouter 'share' au type interaction_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'share' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'interaction_type')
    ) THEN
        ALTER TYPE interaction_type ADD VALUE 'share';
    END IF;
END $$;

-- Ajouter la clé primaire sur medias.id si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'medias_pkey' 
        AND table_name = 'medias'
    ) THEN
        ALTER TABLE public.medias ADD CONSTRAINT medias_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- Vérifier et recréer la clé primaire sur profiles.id si nécessaire
DO $$ 
BEGIN
    -- Supprimer la contrainte existante si elle existe mais ne fonctionne pas
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_pkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_pkey;
    END IF;
    
    -- Recréer la clé primaire
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
END $$;

-- Ajouter la contrainte foreign key entre comments.media_id et medias.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_media_id_fkey' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE public.comments 
        ADD CONSTRAINT comments_media_id_fkey 
        FOREIGN KEY (media_id) REFERENCES public.medias (id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ajouter la contrainte foreign key entre challenges.user_id et profiles.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'challenges_user_id_profiles_fkey' 
        AND table_name = 'challenges'
    ) THEN
        ALTER TABLE public.challenges 
        ADD CONSTRAINT challenges_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ajouter les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_comments_media_id
ON public.comments USING btree (media_id);

CREATE INDEX IF NOT EXISTS idx_challenges_user_id
ON public.challenges USING btree (user_id);

COMMIT;
