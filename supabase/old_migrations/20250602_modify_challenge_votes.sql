-- Modification de la table challenge_votes pour supporter les votes jury
ALTER TABLE challenge_votes 
  -- Ajout des colonnes pour les critères de vote jury
  ADD COLUMN IF NOT EXISTS vote_type TEXT NOT NULL DEFAULT 'public' CHECK (vote_type IN ('public', 'jury')),
  ADD COLUMN IF NOT EXISTS technique_points INTEGER CHECK (technique_points >= 0 AND technique_points <= 5),
  ADD COLUMN IF NOT EXISTS originalite_points INTEGER CHECK (originalite_points >= 0 AND originalite_points <= 5),
  ADD COLUMN IF NOT EXISTS interpretation_points INTEGER CHECK (interpretation_points >= 0 AND interpretation_points <= 5),
  -- Modification de la contrainte sur points pour permettre 0
  DROP CONSTRAINT IF EXISTS challenge_votes_points_check,
  ADD CONSTRAINT challenge_votes_points_check CHECK (points >= 0 AND points <= 5);

-- Ajout des contraintes pour les votes jury
ALTER TABLE challenge_votes
  ADD CONSTRAINT jury_vote_criteria_required CHECK (
    (vote_type = 'jury' AND technique_points IS NOT NULL 
     AND originalite_points IS NOT NULL 
     AND interpretation_points IS NOT NULL)
    OR
    (vote_type = 'public' AND technique_points IS NULL 
     AND originalite_points IS NULL 
     AND interpretation_points IS NULL)
  );

-- Suppression de la fonction existante avant de la recréer
DROP FUNCTION IF EXISTS get_challenge_votes(UUID);

-- Création de la nouvelle fonction avec support des votes jury
CREATE FUNCTION get_challenge_votes(_challenge_id UUID)
RETURNS TABLE (
    participation_id UUID,
    total_points BIGINT,
    voters_count BIGINT,
    average_points NUMERIC,
    -- Ajout des moyennes pour les critères jury
    avg_technique NUMERIC,
    avg_originalite NUMERIC,
    avg_interpretation NUMERIC,
    jury_votes_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.participation_id,
        SUM(cv.points) as total_points,
        COUNT(cv.voter_id) as voters_count,
        ROUND(AVG(cv.points)::numeric, 1) as average_points,
        -- Calcul des moyennes pour les votes jury uniquement
        ROUND(AVG(cv.technique_points) FILTER (WHERE cv.vote_type = 'jury')::numeric, 1) as avg_technique,
        ROUND(AVG(cv.originalite_points) FILTER (WHERE cv.vote_type = 'jury')::numeric, 1) as avg_originalite,
        ROUND(AVG(cv.interpretation_points) FILTER (WHERE cv.vote_type = 'jury')::numeric, 1) as avg_interpretation,
        COUNT(cv.voter_id) FILTER (WHERE cv.vote_type = 'jury') as jury_votes_count
    FROM challenge_votes cv
    WHERE cv.challenge_id = _challenge_id
    GROUP BY cv.participation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mise à jour des politiques pour les votes jury
DROP POLICY IF EXISTS "Les utilisateurs peuvent voter une seule fois" ON challenge_votes;
CREATE POLICY "Les utilisateurs peuvent voter une seule fois"
ON challenge_votes FOR INSERT
TO authenticated
WITH CHECK (
    voter_id = auth.uid() AND
    (
        -- Pour les votes publics, pas de vérification supplémentaire
        (vote_type = 'public') OR
        -- Pour les votes jury, vérifier que l'utilisateur est jury
        (vote_type = 'jury' AND EXISTS (
            SELECT 1 FROM challenge_jury cj 
            WHERE cj.challenge_id = challenge_votes.challenge_id 
            AND cj.user_id = auth.uid()
        ))
    )
);

COMMENT ON TABLE challenge_votes IS 'Table pour les votes publics et jury des challenges';
