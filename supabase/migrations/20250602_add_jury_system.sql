-- Création de la fonction set_updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ajout du type de vote dans la table challenges
ALTER TABLE challenges
ADD COLUMN voting_type VARCHAR(10) NOT NULL DEFAULT 'public' CHECK (voting_type IN ('public', 'jury'));

-- Création de la table challenge_jury
CREATE TABLE challenge_jury (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un utilisateur ne peut être jury qu'une seule fois par challenge
    CONSTRAINT unique_jury_per_challenge UNIQUE (challenge_id, user_id)
);

-- Enable RLS
ALTER TABLE challenge_jury ENABLE ROW LEVEL SECURITY;

-- Policies pour challenge_jury
CREATE POLICY "Les jurys sont visibles par tous"
ON challenge_jury FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Seul le créateur du challenge peut ajouter des jurys"
ON challenge_jury FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM challenges c
        WHERE c.id = challenge_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Seul le créateur du challenge peut supprimer des jurys"
ON challenge_jury FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM challenges c
        WHERE c.id = challenge_id
        AND c.user_id = auth.uid()
    )
);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON challenge_jury
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Index pour améliorer les performances des recherches
CREATE INDEX challenge_jury_challenge_id_idx ON challenge_jury(challenge_id);
CREATE INDEX challenge_jury_user_id_idx ON challenge_jury(user_id);
