-- Créer la table des classements hebdomadaires si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'weekly_rankings') THEN
        CREATE TABLE weekly_rankings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE,
    week_end DATE,
    points_earned INTEGER DEFAULT 0,
    rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
        );
    END IF;
END $$;

-- Créer une policy pour permettre la lecture des weekly_rankings
-- Activer RLS si ce n'est pas déjà fait
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'weekly_rankings' AND rowsecurity = true) THEN
        ALTER TABLE weekly_rankings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_rankings' AND policyname = 'Les weekly_rankings sont visibles par tous') THEN
        CREATE POLICY "Les weekly_rankings sont visibles par tous" ON weekly_rankings
    FOR SELECT
    USING (true);
    END IF;
END $$;

-- Index pour optimiser les requêtes par semaine et rang
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'weekly_rankings' AND indexname = 'idx_weekly_rankings_week') THEN
        CREATE INDEX idx_weekly_rankings_week ON weekly_rankings(week_start, rank);
    END IF;
END $$;

-- Fonction pour calculer le classement de la semaine
CREATE OR REPLACE FUNCTION calculate_weekly_ranking()
RETURNS void AS $$
DECLARE
    v_week_start DATE;
    v_week_end DATE;
BEGIN
    -- Définir la période (du lundi au dimanche)
    v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
    v_week_end := (v_week_start + INTERVAL '6 days')::DATE;

    -- Supprimer les anciens classements de la semaine en cours
    DELETE FROM weekly_rankings
    WHERE week_start = v_week_start;

    -- Insérer les nouveaux classements
    WITH weekly_points AS (
        -- Calculer les points gagnés cette semaine pour les utilisateurs Bronze+
        SELECT 
            p.id as user_id,
            COALESCE(SUM(ph.points_change), 0) as points_this_week
        FROM profiles p
        LEFT JOIN points_history ph ON 
            ph.user_id = p.id AND 
            ph.created_at >= v_week_start AND 
            ph.created_at <= v_week_end
        WHERE p.points >= 150  -- Uniquement les utilisateurs Bronze+
        GROUP BY p.id
    ),
    rankings AS (
        -- Calculer les rangs
        SELECT 
            user_id,
            points_this_week,
            RANK() OVER (ORDER BY points_this_week DESC) as rank
        FROM weekly_points
        WHERE points_this_week > 0  -- Exclure les utilisateurs inactifs
    )
    INSERT INTO weekly_rankings (
        user_id,
        week_start,
        week_end,
        points_earned,
        rank
    )
    SELECT 
        user_id,
        v_week_start,
        v_week_end,
        points_this_week,
        rank
    FROM rankings;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour mettre à jour le classement chaque fois qu'un point est ajouté
CREATE OR REPLACE FUNCTION update_ranking_on_points_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_weekly_ranking();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER points_history_ranking_trigger
AFTER INSERT OR UPDATE ON points_history
FOR EACH STATEMENT
EXECUTE FUNCTION update_ranking_on_points_change();
