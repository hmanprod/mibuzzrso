-- Migration pour lier proprement les médias à un challenge

BEGIN;

-- Créer la table de jonction
CREATE TABLE IF NOT EXISTS public.challenges_medias (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    media_id uuid NOT NULL REFERENCES medias(id) ON DELETE CASCADE,
    position integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT unique_challenge_media UNIQUE (challenge_id, media_id),
    CONSTRAINT unique_challenge_media_position UNIQUE (challenge_id, position)
);

-- Optionnel : supprimer la colonne medias JSONB de la table challenges
ALTER TABLE challenges DROP COLUMN IF EXISTS medias;

COMMIT;
