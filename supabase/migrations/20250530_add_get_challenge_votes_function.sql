-- Fonction pour récupérer les votes d'un challenge avec le total des points par participation
CREATE OR REPLACE FUNCTION get_challenge_votes(_challenge_id UUID)
RETURNS TABLE (
    participation_id UUID,
    total_points BIGINT,
    voters_count BIGINT,
    average_points NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.participation_id,
        SUM(cv.points) as total_points,
        COUNT(cv.voter_id) as voters_count,
        ROUND(AVG(cv.points)::numeric, 1) as average_points
    FROM challenge_votes cv
    WHERE cv.challenge_id = _challenge_id
    GROUP BY cv.participation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
