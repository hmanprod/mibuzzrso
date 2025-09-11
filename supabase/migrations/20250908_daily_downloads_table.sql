-- Migration pour créer la table daily_downloads
-- Créé le 2025-09-08

BEGIN;

-- Table pour tracker les téléchargements quotidiens par utilisateur
CREATE TABLE IF NOT EXISTS public.daily_downloads (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    download_date date NOT NULL DEFAULT CURRENT_DATE,
    download_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Contrainte unique pour éviter les doublons par utilisateur/jour
    UNIQUE(user_id, download_date)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_daily_downloads_user_date ON public.daily_downloads(user_id, download_date);
CREATE INDEX IF NOT EXISTS idx_daily_downloads_date ON public.daily_downloads(download_date);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER set_daily_downloads_updated_at
    BEFORE UPDATE ON public.daily_downloads
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.daily_downloads ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs ne peuvent voir que leurs propres données
CREATE POLICY "Users can view their own daily downloads" ON public.daily_downloads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily downloads" ON public.daily_downloads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily downloads" ON public.daily_downloads
    FOR UPDATE USING (auth.uid() = user_id);

COMMIT;
