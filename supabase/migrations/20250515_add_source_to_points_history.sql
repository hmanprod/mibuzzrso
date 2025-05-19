-- Ajouter les colonnes source et source_id à la table points_history
ALTER TABLE points_history
ADD COLUMN IF NOT EXISTS source VARCHAR(50),
ADD COLUMN IF NOT EXISTS source_id UUID;

-- Créer un index sur source et source_id pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_points_history_source 
ON points_history(source, source_id);
