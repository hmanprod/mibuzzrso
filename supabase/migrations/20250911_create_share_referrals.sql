-- Migration pour créer les tables de codes de parrainage
-- Créé le 2025-09-11

BEGIN;

-- Table pour stocker les codes de parrainage générés
CREATE TABLE public.share_referrals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT share_referrals_pkey PRIMARY KEY (id),
    CONSTRAINT share_referrals_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT share_referrals_post_id_fkey FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE
);

-- Table pour tracker les visites des liens partagés
CREATE TABLE public.share_referral_visits (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    referral_code text NOT NULL,
    visitor_user_id uuid NULL,
    visitor_ip inet NULL,
    visited_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT share_referral_visits_pkey PRIMARY KEY (id),
    CONSTRAINT share_referral_visits_referral_code_fkey FOREIGN KEY (referral_code)
        REFERENCES share_referrals (code) ON DELETE CASCADE,
    CONSTRAINT share_referral_visits_visitor_user_id_fkey FOREIGN KEY (visitor_user_id)
        REFERENCES auth.users (id) ON DELETE SET NULL
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_share_referrals_code
    ON public.share_referrals USING btree (code);

CREATE INDEX IF NOT EXISTS idx_share_referrals_user_id
    ON public.share_referrals USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_share_referrals_post_id
    ON public.share_referrals USING btree (post_id);

CREATE INDEX IF NOT EXISTS idx_share_referral_visits_referral_code
    ON public.share_referral_visits USING btree (referral_code);

CREATE INDEX IF NOT EXISTS idx_share_referral_visits_visitor_user_id
    ON public.share_referral_visits USING btree (visitor_user_id);

CREATE INDEX IF NOT EXISTS idx_share_referral_visits_visited_at
    ON public.share_referral_visits USING btree (visited_at);

-- Index composite pour éviter les visites multiples du même utilisateur
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_visitor_referral
    ON public.share_referral_visits USING btree (referral_code, visitor_user_id)
    WHERE visitor_user_id IS NOT NULL;

COMMIT;
