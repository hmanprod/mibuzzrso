-- Ajoute la colonne challenge_id à la table interactions, adapte la contrainte CHECK et ajoute un index

BEGIN;

ALTER TABLE interactions
  ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES challenges(id);


CREATE INDEX IF NOT EXISTS idx_interactions_challenge_id ON interactions(challenge_id);

COMMIT;
