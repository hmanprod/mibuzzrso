-- Create challenge votes table
CREATE TABLE IF NOT EXISTS challenge_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    participation_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points >= 1 AND points <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un utilisateur ne peut voter qu'une seule fois pour une participation
    CONSTRAINT unique_vote_per_participation UNIQUE (participation_id, voter_id)
);

-- Enable RLS
ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Les votes sont visibles par tous"
ON challenge_votes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Les utilisateurs peuvent voter une seule fois"
ON challenge_votes FOR INSERT
TO authenticated
WITH CHECK (
    -- Vérifie que l'utilisateur est bien le votant
    voter_id = auth.uid()
    -- La contrainte UNIQUE s'occupera d'empêcher les votes multiples
);

-- Create function to check if user has listened to the participation
CREATE OR REPLACE FUNCTION can_vote_for_participation(
    _participation_id UUID,
    _user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- TODO: Implémenter la logique pour vérifier si l'utilisateur a écouté la participation
    -- Pour l'instant, on retourne toujours true
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
