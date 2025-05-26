-- Supprimer le trigger et les fonctions associées
DROP TRIGGER IF EXISTS points_history_ranking_trigger ON points_history;
DROP FUNCTION IF EXISTS update_ranking_on_points_change();
DROP FUNCTION IF EXISTS calculate_weekly_ranking();
