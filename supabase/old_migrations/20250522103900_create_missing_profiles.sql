-- Migration pour créer les profils manquants
-- Cette migration identifie les utilisateurs dans auth.users qui n'ont pas de profil correspondant
-- et crée ces profils manquants avec les valeurs par défaut

-- Commencer une transaction
BEGIN;

-- Créer une table temporaire pour stocker les utilisateurs sans profil
CREATE TEMP TABLE users_without_profiles AS
SELECT au.id
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Afficher le nombre d'utilisateurs sans profil (pour information)
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count FROM users_without_profiles;
    RAISE NOTICE 'Nombre d''utilisateurs sans profil: %', missing_count;
END $$;

-- Insérer les profils manquants
INSERT INTO public.profiles (
    id,
    created_at,
    updated_at,
    bio,
    stage_name,
    avatar_url,
    cover_url,
    first_name,
    last_name,
    country,
    gender,
    phone,
    label,
    musical_interests,
    talents,
    social_links,
    points,
    pseudo_url
)
SELECT
    uwp.id,
    NOW(),            -- created_at
    NOW(),            -- updated_at
    NULL,             -- bio
    NULL,             -- stage_name
    NULL,             -- avatar_url
    NULL,             -- cover_url
    NULL,             -- first_name
    NULL,             -- last_name
    NULL,             -- country
    NULL,             -- gender
    NULL,             -- phone
    NULL,             -- label
    '[]'::jsonb,      -- empty musical_interests array
    '[]'::jsonb,      -- empty talents array
    '{}'::jsonb,      -- empty social_links object
    0,                -- points (défaut à 0)
    NULL              -- pseudo_url (sera généré par le trigger si stage_name est défini plus tard)
FROM users_without_profiles uwp;

-- Afficher le nombre de profils créés (pour information)
DO $$
DECLARE
    created_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO created_count FROM users_without_profiles;
    RAISE NOTICE 'Nombre de profils créés: %', created_count;
END $$;

-- Supprimer la table temporaire
DROP TABLE users_without_profiles;

-- Vérifier que le trigger existe toujours
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        -- Recréer le trigger s'il n'existe pas
        EXECUTE '
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
        ';
        RAISE NOTICE 'Le trigger on_auth_user_created a été recréé.';
    ELSE
        RAISE NOTICE 'Le trigger on_auth_user_created existe déjà.';
    END IF;
END $$;

-- Valider la transaction
COMMIT;
