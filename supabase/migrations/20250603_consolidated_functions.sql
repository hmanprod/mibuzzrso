    -- Fichier de fonctions consolidé pour Mibuzz
    -- Créé le 2025-06-03

    -- Ce fichier contient toutes les fonctions SQL de la base de données
    -- Organisé par sections logiques : recherche, points, classements, etc.

    BEGIN;

    -- Section 1: Fonctions de recherche de posts
    CREATE OR REPLACE FUNCTION get_posts(
        p_user_id uuid,
        p_page integer DEFAULT 1,
        p_limit integer DEFAULT 10,
        p_search_term text DEFAULT NULL,
        p_filter text DEFAULT NULL,
        p_type text DEFAULT NULL,
        p_challenge_id uuid DEFAULT NULL
    )
    RETURNS TABLE (
        id uuid,
        created_at timestamptz,
        updated_at timestamptz,
        content text,
        user_id uuid,
        post_type text,
        challenge_id uuid,
        media_ids uuid[],
        media_urls text[],
        media_types text[],
        media_durations numeric[],
        media_titles text[],
        media_descriptions text[],
        media_covers text[],
        media_authors text[],
        stage_name text,
        avatar_url text,
        like_count bigint,
        comment_count bigint,
        has_liked boolean,
        has_commented boolean,
        match_source text
    ) AS $$
    DECLARE
        v_offset INTEGER := (p_page - 1) * p_limit;
    BEGIN
        RETURN QUERY
        WITH post_matches AS (
            SELECT DISTINCT ON (p.id)
                p.id,
                p.created_at,
                p.updated_at,
                p.content,
                p.user_id,
                p.post_type::text,
                p.challenge_id,
                array_agg(m.id ORDER BY pm.position) AS media_ids,
                array_agg(m.media_url ORDER BY pm.position) AS media_urls,
                array_agg(m.media_type::text ORDER BY pm.position) AS media_types,
                array_agg(m.duration ORDER BY pm.position) AS media_durations,
                array_agg(m.title ORDER BY pm.position) AS media_titles,
                array_agg(m.description ORDER BY pm.position) AS media_descriptions,
                array_agg(m.media_cover_url ORDER BY pm.position) AS media_covers,
                array_agg(m.author ORDER BY pm.position) AS media_authors,
                pr.stage_name,
                pr.avatar_url,
                COUNT(DISTINCT il.id) AS like_count,
                COUNT(DISTINCT ic.id) AS comment_count,
                bool_or(il.user_id = p_user_id) AS has_liked,
                bool_or(ic.user_id = p_user_id) AS has_commented,
                FIRST_VALUE(
                    CASE
                        WHEN p_search_term IS NOT NULL AND p.content ILIKE '%' || p_search_term || '%' THEN 'content'
                        WHEN p_search_term IS NOT NULL AND m.title ILIKE '%' || p_search_term || '%' THEN 'title'
                        WHEN p_search_term IS NOT NULL AND m.description ILIKE '%' || p_search_term || '%' THEN 'description'
                        ELSE NULL
                    END
                ) OVER (PARTITION BY p.id ORDER BY
                    CASE
                        WHEN p_search_term IS NOT NULL AND p.content ILIKE '%' || p_search_term || '%' THEN 1
                        WHEN p_search_term IS NOT NULL AND m.title ILIKE '%' || p_search_term || '%' THEN 2
                        WHEN p_search_term IS NOT NULL AND m.description ILIKE '%' || p_search_term || '%' THEN 3
                        ELSE 4
                    END
                ) AS match_source
            FROM posts p
            LEFT JOIN posts_medias pm ON p.id = pm.post_id
            LEFT JOIN medias m ON pm.media_id = m.id
            LEFT JOIN profiles pr ON p.user_id = pr.id
            LEFT JOIN interactions il ON p.id = il.post_id AND il.type = 'like'
            LEFT JOIN interactions ic ON p.id = ic.post_id AND ic.type = 'comment'
            WHERE
                (p_search_term IS NULL OR
                p.content ILIKE '%' || p_search_term || '%' OR
                m.title ILIKE '%' || p_search_term || '%' OR
                m.description ILIKE '%' || p_search_term || '%')
                AND (p_type IS NULL OR p.post_type::text = p_type)
                AND (p_challenge_id IS NULL OR p.challenge_id = p_challenge_id)
                AND CASE
                    WHEN p_filter = 'following' THEN EXISTS (
                        SELECT 1 FROM follows f
                        WHERE f.follower_id = p_user_id AND f.following_id = p.user_id
                    )
                    WHEN p_filter = 'my_posts' THEN p.user_id = p_user_id
                    ELSE true
                END
            GROUP BY
                p.id,
                p.created_at,
                p.updated_at,
                p.content,
                p.user_id,
                p.post_type,
                p.challenge_id,
                pr.stage_name,
                pr.avatar_url
        )
        SELECT *
        FROM post_matches
        ORDER BY created_at DESC
        OFFSET v_offset
        LIMIT p_limit;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Fonction de recherche avancée de posts
    CREATE OR REPLACE FUNCTION public.search_posts(
        search_term text,
        page_num integer DEFAULT 1,
        items_per_page integer DEFAULT 10,
        current_user_id uuid DEFAULT NULL::uuid
    )
    RETURNS TABLE (
        id uuid,
        created_at timestamptz,
        content text,
        user_id uuid,
        post_type text,
        challenge_id uuid,
        media_ids uuid[],
        media_urls text[],
        media_types text[],
        media_durations numeric[],
        media_titles text[],
        media_descriptions text[],
        media_covers text[],
        media_authors text[],
        stage_name text,
        avatar_url text,
        like_count bigint,
        comment_count bigint,
        has_liked boolean,
        has_commented boolean,
        match_source text,
        total_count bigint
    ) AS $$
    DECLARE
        v_offset INTEGER := (page_num - 1) * items_per_page;
    BEGIN
        RETURN QUERY
        WITH post_search AS (
            SELECT DISTINCT ON (p.id)
                p.id,
                p.created_at,
                p.content,
                p.user_id,
                p.post_type::text,
                p.challenge_id,
                array_agg(m.id ORDER BY pm.position) AS media_ids,
                array_agg(m.media_url ORDER BY pm.position) AS media_urls,
                array_agg(m.media_type::text ORDER BY pm.position) AS media_types,
                array_agg(m.duration ORDER BY pm.position) AS media_durations,
                array_agg(m.title ORDER BY pm.position) AS media_titles,
                array_agg(m.description ORDER BY pm.position) AS media_descriptions,
                array_agg(m.media_cover_url ORDER BY pm.position) AS media_covers,
                array_agg(m.author ORDER BY pm.position) AS media_authors,
                pr.stage_name,
                pr.avatar_url,
                COUNT(DISTINCT il.id) AS like_count,
                COUNT(DISTINCT ic.id) AS comment_count,
                bool_or(il.user_id = current_user_id) AS has_liked,
                bool_or(ic.user_id = current_user_id) AS has_commented,
                FIRST_VALUE(
                    CASE
                        WHEN search_term IS NOT NULL AND p.content ILIKE '%' || search_term || '%' THEN 'content'
                        WHEN search_term IS NOT NULL AND m.title ILIKE '%' || search_term || '%' THEN 'title'
                        WHEN search_term IS NOT NULL AND m.description ILIKE '%' || search_term || '%' THEN 'description'
                        ELSE NULL
                    END
                ) OVER (PARTITION BY p.id ORDER BY
                    CASE
                        WHEN search_term IS NOT NULL AND p.content ILIKE '%' || search_term || '%' THEN 1
                        WHEN search_term IS NOT NULL AND m.title ILIKE '%' || search_term || '%' THEN 2
                        WHEN search_term IS NOT NULL AND m.description ILIKE '%' || search_term || '%' THEN 3
                        ELSE 4
                    END
                ) AS match_source
            FROM posts p
            LEFT JOIN posts_medias pm ON p.id = pm.post_id
            LEFT JOIN medias m ON pm.media_id = m.id
            LEFT JOIN profiles pr ON p.user_id = pr.id
            LEFT JOIN interactions il ON p.id = il.post_id AND il.type = 'like'
            LEFT JOIN interactions ic ON p.id = ic.post_id AND ic.type = 'comment'
            WHERE
                (search_term IS NULL OR
                p.content ILIKE '%' || search_term || '%' OR
                m.title ILIKE '%' || search_term || '%' OR
                m.description ILIKE '%' || search_term || '%')
            GROUP BY
                p.id,
                p.created_at,
                p.content,
                p.user_id,
                p.post_type,
                p.challenge_id,
                pr.stage_name,
                pr.avatar_url
        ),
        post_count AS (
            SELECT COUNT(*) as total FROM post_search
        )
        SELECT ps.*, pc.total as total_count
        FROM post_search ps, post_count pc
        ORDER BY ps.created_at DESC
        OFFSET v_offset
        LIMIT items_per_page;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Section 2: Fonctions de gestion des médias
    CREATE OR REPLACE FUNCTION get_media_with_likes(
        p_user_id uuid,
        p_page integer DEFAULT 1,
        p_limit integer DEFAULT 10,
        p_search_term text DEFAULT NULL,
        p_filter text DEFAULT NULL,
        p_media_type text DEFAULT NULL
    )
    RETURNS TABLE (
        id uuid,
        created_at timestamptz,
        updated_at timestamptz,
        media_type text,
        media_url text,
        media_public_id text,
        duration numeric,
        title text,
        description text,
        user_id uuid,
        media_cover_url text,
        author text,
        stage_name text,
        avatar_url text,
        like_count bigint,
        comment_count bigint,
        has_liked boolean,
        has_commented boolean,
        match_source text
    ) AS $$
    DECLARE
        v_offset INTEGER := (p_page - 1) * p_limit;
    BEGIN
        RETURN QUERY
        WITH media_matches AS (
            SELECT DISTINCT ON (m.id)
                m.id,
                m.created_at,
                m.updated_at,
                m.media_type::text,
                m.media_url,
                m.media_public_id,
                m.duration,
                m.title,
                m.description,
                m.user_id,
                m.media_cover_url,
                m.author,
                pr.stage_name,
                pr.avatar_url,
                COUNT(DISTINCT il.id) AS like_count,
                COUNT(DISTINCT ic.id) AS comment_count,
                bool_or(il.user_id = p_user_id) AS has_liked,
                bool_or(ic.user_id = p_user_id) AS has_commented,
                FIRST_VALUE(
                    CASE
                        WHEN p_search_term IS NOT NULL AND m.title ILIKE '%' || p_search_term || '%' THEN 'title'
                        WHEN p_search_term IS NOT NULL AND m.description ILIKE '%' || p_search_term || '%' THEN 'description'
                        WHEN p_search_term IS NOT NULL AND m.author ILIKE '%' || p_search_term || '%' THEN 'author'
                        ELSE NULL
                    END
                ) OVER (PARTITION BY m.id ORDER BY
                    CASE
                        WHEN p_search_term IS NOT NULL AND m.title ILIKE '%' || p_search_term || '%' THEN 1
                        WHEN p_search_term IS NOT NULL AND m.description ILIKE '%' || p_search_term || '%' THEN 2
                        WHEN p_search_term IS NOT NULL AND m.author ILIKE '%' || p_search_term || '%' THEN 3
                        ELSE 4
                    END
                ) AS match_source
            FROM medias m
            LEFT JOIN profiles pr ON m.user_id = pr.id
            LEFT JOIN interactions il ON m.id = il.media_id AND il.type = 'like'
            LEFT JOIN interactions ic ON m.id = ic.media_id AND ic.type = 'comment'
            WHERE
                (p_search_term IS NULL OR
                m.title ILIKE '%' || p_search_term || '%' OR
                m.description ILIKE '%' || p_search_term || '%' OR
                m.author ILIKE '%' || p_search_term || '%')
                AND (p_media_type IS NULL OR m.media_type::text = p_media_type)
                AND CASE
                    WHEN p_filter = 'following' THEN EXISTS (
                        SELECT 1 FROM follows f
                        WHERE f.follower_id = p_user_id AND f.following_id = m.user_id
                    )
                    WHEN p_filter = 'my_media' THEN m.user_id = p_user_id
                    ELSE true
                END
            GROUP BY
                m.id,
                m.created_at,
                m.updated_at,
                m.media_type,
                m.media_url,
                m.media_public_id,
                m.duration,
                m.title,
                m.description,
                m.user_id,
                m.media_cover_url,
                m.author,
                pr.stage_name,
                pr.avatar_url
        )
        SELECT *
        FROM media_matches
        ORDER BY created_at DESC
        OFFSET v_offset
        LIMIT p_limit;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Section 3: Fonctions de gestion des points
    CREATE OR REPLACE FUNCTION add_points_for_media(
        p_user_id uuid,
        p_points integer,
        p_reason text
    ) RETURNS void AS $$
    BEGIN
        -- Ajouter les points à l'utilisateur
        UPDATE profiles
        SET points = points + p_points
        WHERE id = p_user_id;

        -- Enregistrer l'historique des points
        INSERT INTO points_history (user_id, points_change, reason)
        VALUES (p_user_id, p_points, p_reason);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE OR REPLACE FUNCTION public.get_current_week()
    RETURNS TABLE(week_start DATE, week_end DATE) AS $$
    BEGIN
        RETURN QUERY SELECT 
            date_trunc('week', CURRENT_DATE)::DATE,
            (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION public.update_user_weekly_ranking(p_user_id UUID, p_points INTEGER)
    RETURNS void AS $$
    DECLARE
        v_week_start DATE;
        v_week_end DATE;
        v_current_points INTEGER;
        v_new_rank INTEGER;
    BEGIN
        -- Vérifier si l'utilisateur a au moins 150 points
        SELECT points INTO v_current_points
        FROM profiles
        WHERE id = p_user_id;

        IF v_current_points < 150 THEN
            RETURN;
        END IF;

        -- Obtenir les dates de la semaine
        SELECT * FROM get_current_week() INTO v_week_start, v_week_end;

        -- Mettre à jour ou insérer l'entrée dans weekly_rankings
        INSERT INTO weekly_rankings (
            user_id,
            week_start,
            week_end,
            points_earned,
            rank
        )
        VALUES (
            p_user_id,
            v_week_start,
            v_week_end,
            p_points,
            1  -- Rang temporaire
        )
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET
            points_earned = weekly_rankings.points_earned + p_points;

        -- Recalculer les rangs pour tous les utilisateurs de la semaine
        WITH ranked_users AS (
            SELECT 
                user_id,
                RANK() OVER (ORDER BY points_earned DESC) as new_rank
            FROM weekly_rankings
            WHERE week_start = v_week_start
        )
        UPDATE weekly_rankings wr
        SET rank = ru.new_rank
        FROM ranked_users ru
        WHERE wr.user_id = ru.user_id
        AND wr.week_start = v_week_start;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION public.add_points_for_like_with_ranking(p_media_id uuid, p_user_id uuid)
    RETURNS void AS $$
    DECLARE
        v_points_added INTEGER;
    BEGIN
        -- Appeler la fonction existante et récupérer les points ajoutés
        PERFORM add_points_for_like(p_media_id, p_user_id);
        
        -- Récupérer les points qui ont été ajoutés
        SELECT points_change INTO v_points_added
        FROM points_history
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 1;

        -- Mettre à jour le classement
        IF v_points_added > 0 THEN
            PERFORM update_user_weekly_ranking(p_user_id, v_points_added);
        END IF;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION public.add_points_for_comment_with_ranking(p_comment_id uuid)
    RETURNS void AS $$
    DECLARE
        v_points_added INTEGER;
        v_user_id UUID;
    BEGIN
        -- Appeler la fonction existante
        PERFORM add_points_for_comment(p_comment_id);
        
        -- Récupérer les points qui ont été ajoutés et l'utilisateur
        SELECT points_change, user_id INTO v_points_added, v_user_id
        FROM points_history
        WHERE reason LIKE 'Commentaire reçu%' || p_comment_id::TEXT
        ORDER BY created_at DESC
        LIMIT 1;

        -- Mettre à jour le classement
        IF v_points_added > 0 THEN
            PERFORM update_user_weekly_ranking(v_user_id, v_points_added);
        END IF;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION public.add_points_for_commenting_with_ranking(p_comment_id uuid, p_user_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    AS $function$
    DECLARE
        v_points_added INTEGER;
    BEGIN
        -- Appeler la fonction existante
        PERFORM add_points_for_commenting(p_comment_id, p_user_id);
        
        -- Récupérer les points qui ont été ajoutés
        SELECT points_change INTO v_points_added
        FROM points_history
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 1;

        -- Mettre à jour le classement
        IF v_points_added > 0 THEN
            PERFORM update_user_weekly_ranking(p_user_id, v_points_added);
        END IF;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.delete_all_interactions()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    DELETE FROM interactions;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.delete_all_daily_comments()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    DELETE FROM daily_comments;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.delete_all_comments()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    DELETE FROM comments;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.delete_all_unique_likes()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    DELETE FROM unique_likes;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.delete_all_daily_media_uploads()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    DELETE FROM daily_media_uploads;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.delete_all_post_medias()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    DELETE FROM post_medias;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.delete_all_posts()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    DELETE FROM posts;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.delete_all_medias()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    DELETE FROM medias;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.can_vote_for_participation(_participation_id uuid, _user_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
        -- TODO: Implémenter la logique pour vérifier si l'utilisateur a écouté la participation
        -- Pour l'instant, on retourne toujours true
        RETURN TRUE;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.calculate_initial_points()
    RETURNS void
    LANGUAGE plpgsql
    AS $function$
    DECLARE
        user_record RECORD;
    BEGIN
        -- Pour chaque utilisateur
        FOR user_record IN SELECT id FROM profiles
        LOOP
            -- Points de base
            UPDATE profiles SET points = 0 WHERE id = user_record.id;

            -- Points pour les médias publiés (+10 par média)
            UPDATE profiles 
            SET points = points + (
                SELECT COUNT(*) * 10 
                FROM medias 
                WHERE user_id = user_record.id
            )
            WHERE id = user_record.id;

            -- Points pour les likes reçus (+2 par like)
            UPDATE profiles 
            SET points = points + (
                SELECT COUNT(*) * 2 
                FROM interactions i
                JOIN medias m ON m.id = i.media_id
                WHERE m.user_id = user_record.id 
                AND i.type = 'like'
            )
            WHERE id = user_record.id;

            -- Points pour les commentaires reçus (+1 par commentaire)
            UPDATE profiles 
            SET points = points + (
                SELECT COUNT(*) * 1 
                FROM comments c
                JOIN medias m ON m.id = c.media_id
                WHERE m.user_id = user_record.id
            )
            WHERE id = user_record.id;

            -- Points pour les challenges gagnés
            -- Note: À adapter selon votre structure de données des challenges

            -- Enregistrer dans l'historique
            INSERT INTO points_history (user_id, points_change, reason)
            SELECT 
                user_record.id,
                profiles.points - 1000,
                'Initial points calculation'
            FROM profiles
            WHERE id = user_record.id;
        END LOOP;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.generate_pseudo_url(stage_name text)

    RETURNS text

    LANGUAGE plpgsql
    AS $function$
    DECLARE

    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
    BEGIN

    -- Convertir le stage_name en slug

    base_slug := LOWER(stage_name);
    
    -- Remplacer les espaces par des tirets

    base_slug := REPLACE(base_slug, ' ', '-');
    
    -- Supprimer les caractères spéciaux

    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\-]', '', 'g');
    
    -- Supprimer les tirets multiples

    base_slug := REGEXP_REPLACE(base_slug, '\-+', '-', 'g');
    
    -- Supprimer les tirets au début et à la fin

    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Si le slug est vide après nettoyage, utiliser 'user'

    IF base_slug = '' THEN

        base_slug := 'user';
    END IF;
    
    -- Essayer le slug de base d'abord

    final_slug := base_slug;
    
    -- Si le slug existe déjà, ajouter un numéro jusqu'à trouver un slug unique

    WHILE EXISTS (SELECT 1 FROM profiles WHERE pseudo_url = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.generate_pseudo_url_trigger()

    RETURNS trigger

    LANGUAGE plpgsql
    AS $function$
    BEGIN

    -- Si le pseudo_url n'est pas défini et que le stage_name existe

    IF NEW.pseudo_url IS NULL AND NEW.stage_name IS NOT NULL THEN

        NEW.pseudo_url := generate_pseudo_url(NEW.stage_name);
    END IF;
    
    RETURN NEW;
    END;
    $function$;

    CREATE OR REPLACE TRIGGER ensure_pseudo_url
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_pseudo_url_trigger();

    CREATE OR REPLACE FUNCTION public.get_table_columns(p_table_name text)
    RETURNS TABLE(column_name text, data_type text, is_nullable text, column_default text)
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    RETURN QUERY
    SELECT
        col.column_name::text,
        col.data_type::text,
        col.is_nullable::text,
        col.column_default::text
    FROM information_schema.columns col
    WHERE col.table_schema = 'public'
        AND col.table_name = p_table_name
    ORDER BY col.ordinal_position;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_all_tables()

    RETURNS TABLE(name text)

    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN

    RETURN QUERY
    SELECT t.tablename::text AS name
    FROM pg_catalog.pg_tables t
    WHERE t.schemaname = 'public';
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_followers_count(profile_id uuid)

    RETURNS integer

    LANGUAGE sql
    SECURITY DEFINER
    AS $function$
        SELECT COUNT(*)::integer
        FROM public.follows
        WHERE following_id = profile_id;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_following_count(profile_id uuid)

    RETURNS integer

    LANGUAGE sql
    SECURITY DEFINER
    AS $function$
        SELECT COUNT(*)::integer
        FROM public.follows
        WHERE follower_id = profile_id;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_liked_media(
    p_current_user_id UUID,
    p_limit INTEGER,
    p_offset INTEGER DEFAULT 0
    )
    RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    media_type media_type,
    media_url TEXT,
    media_public_id TEXT,
    title TEXT,
    author TEXT,
    duration DECIMAL,
    user_id UUID,
    profile JSONB,
    likes_count BIGINT,
    is_liked BOOLEAN,
    total_count BIGINT
    )
    LANGUAGE plpgsql
    AS $function$
    BEGIN
    RETURN QUERY
    WITH liked_media AS (
        -- Get media IDs that the current user has liked
        SELECT media_id
        FROM interactions i
        WHERE i.user_id = p_current_user_id 
        AND i.type = 'like'
    )
    SELECT 
        m.id,
        m.created_at,
        m.media_type,
        m.media_url,
        m.media_public_id,
        m.title,
        m.author,
        m.duration,
        m.user_id,
        jsonb_build_object(
        'id', pr.id,
        'stage_name', pr.stage_name,
        'avatar_url', pr.avatar_url
        ) AS profile,
        COALESCE(
        (SELECT COUNT(*)
        FROM interactions i
        WHERE i.media_id = m.id AND i.type = 'like'),
        0
        )::BIGINT AS likes_count,
        TRUE AS is_liked, -- Always true since these are liked media
        COUNT(*) OVER() AS total_count
    FROM medias m
    JOIN profiles pr ON m.user_id = pr.id
    WHERE m.id IN (SELECT media_id FROM liked_media)
    AND m.media_type IN ('audio', 'video')
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_media_like_status(p_media_id uuid, p_user_id uuid DEFAULT NULL::uuid)
    RETURNS TABLE(like_count bigint, is_liked boolean)
    LANGUAGE plpgsql
    AS $function$
    BEGIN
    RETURN QUERY
    WITH like_count_cte AS (
        SELECT COUNT(*) as count
        FROM interactions
        WHERE media_id = p_media_id
        AND type = 'like'
    ),
    user_like_cte AS (
        SELECT EXISTS (
        SELECT 1
        FROM interactions
        WHERE media_id = p_media_id
        AND user_id = p_user_id
        AND type = 'like'
        ) as liked
    )
    SELECT
        COALESCE((SELECT count FROM like_count_cte), 0),
        CASE
        WHEN p_user_id IS NULL THEN false
        ELSE COALESCE((SELECT liked FROM user_like_cte), false)
        END;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_media_with_likes(
    p_current_user_id uuid,
    p_limit integer,
    p_offset integer DEFAULT 0
    )
    RETURNS TABLE(
    id uuid,
    created_at timestamp with time zone,
    media_type media_type,
    media_url text,
    media_public_id text,
    media_cover_url text,
    title text,
    author text,
    duration numeric,
    user_id uuid,
    profile jsonb,
    likes bigint,
    is_liked boolean,
    is_followed boolean
    )
    LANGUAGE plpgsql
    AS $function$
    BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.created_at,
        m.media_type,
        m.media_url,
        m.media_public_id,
        m.media_cover_url,
        m.title,
        m.author,
        m.duration,
        m.user_id,
        jsonb_build_object(
        'id', pr.id,
        'stage_name', pr.stage_name,
        'avatar_url', pr.avatar_url
        ) AS profile,
        COALESCE(
        (SELECT COUNT(*)
        FROM interactions i
        WHERE i.media_id = m.id AND i.type = 'like'),
        0
        )::BIGINT AS likes,
        COALESCE(
        (SELECT EXISTS (
            SELECT 1
            FROM interactions i
            WHERE i.media_id = m.id
            AND i.user_id = p_current_user_id
            AND i.type = 'like'
        )),
        FALSE
        ) AS is_liked,
        COALESCE(
        (SELECT EXISTS (
            SELECT 1
            FROM follows f
            WHERE f.follower_id = p_current_user_id
            AND f.following_id = m.user_id
        )),
        FALSE
        ) AS is_followed
    FROM medias m
    JOIN profiles pr ON m.user_id = pr.id
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_user_media_with_likes(
    p_current_user_id uuid,
    p_limit integer DEFAULT 12,
    p_offset integer DEFAULT 0
    )
    RETURNS TABLE(
    id uuid,
    created_at timestamp with time zone,
    title text,
    media_url text,
    media_type character varying,
    duration numeric,
    media_public_id text,
    media_cover_url text,
    user_id uuid,
    profile jsonb,
    likes bigint,
    is_liked boolean,
    is_followed boolean,
    total_count bigint
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
        RETURN QUERY
        WITH media_counts AS (
            SELECT COUNT(*) as total
            FROM public.medias m
            WHERE m.user_id = p_current_user_id
        )
        SELECT
            m.id,
            m.created_at,
            m.title,
            m.media_url,
            m.media_type::VARCHAR,
            m.duration,
            m.media_public_id,
            m.media_cover_url,
            m.user_id,
            jsonb_build_object(
                'id', p.id,
                'stage_name', p.stage_name,
                'avatar_url', p.avatar_url,
                'pseudo_url', p.pseudo_url
            ) as profile,
            COUNT(DISTINCT l.id)::BIGINT AS likes,
            EXISTS (
                SELECT 1
                FROM public.interactions il
                WHERE il.media_id = m.id
                AND il.user_id = p_current_user_id
                AND il.type = 'like'
            ) as is_liked,
            EXISTS (
                SELECT 1
                FROM public.follows f
                WHERE f.follower_id = p_current_user_id
                AND f.following_id = m.user_id
            ) as is_followed,
            mc.total as total_count
        FROM public.medias m
        CROSS JOIN media_counts mc
        LEFT JOIN public.profiles p ON m.user_id = p.id
        LEFT JOIN public.interactions l ON l.media_id = m.id AND l.type = 'like'
        WHERE m.user_id = p_current_user_id
        GROUP BY m.id, m.created_at, m.title, m.media_url, m.media_type,
                m.duration, m.media_public_id, m.media_cover_url, m.user_id,
                p.id, p.stage_name, p.avatar_url, p.pseudo_url, mc.total
        ORDER BY m.created_at DESC
        LIMIT p_limit
        OFFSET p_offset;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_user_media_with_likes_and_keywords(
    p_current_user_id uuid,
    p_keywords text,
    p_limit integer DEFAULT 12,
    p_offset integer DEFAULT 0
    )
    RETURNS TABLE(
    id uuid,
    created_at timestamp with time zone,
    title text,
    media_url text,
    media_type character varying,
    duration numeric,
    media_public_id text,
    media_cover_url text,
    user_id uuid,
    profile jsonb,
    likes bigint,
    is_liked boolean,
    is_followed boolean,
    total_count bigint
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
        RETURN QUERY
        WITH media_counts AS (
            SELECT COUNT(*) as total
            FROM public.medias m
            WHERE m.user_id = p_current_user_id
            AND (m.title ILIKE '%' || p_keywords || '%')
        )
        SELECT
            m.id,
            m.created_at,
            m.title,
            m.media_url,
            m.media_type::VARCHAR,
            m.duration,
            m.media_public_id,
            m.media_cover_url,
            m.user_id,
            jsonb_build_object(
                'id', p.id,
                'stage_name', p.stage_name,
                'avatar_url', p.avatar_url,
                'pseudo_url', p.pseudo_url
            ) as profile,
            COUNT(DISTINCT l.id)::BIGINT AS likes,
            EXISTS (
                SELECT 1
                FROM public.interactions il
                WHERE il.media_id = m.id
                AND il.user_id = p_current_user_id
                AND il.type = 'like'
            ) as is_liked,
            EXISTS (
                SELECT 1
                FROM public.follows f
                WHERE f.follower_id = p_current_user_id
                AND f.following_id = m.user_id
            ) as is_followed,
            mc.total as total_count
        FROM public.medias m
        CROSS JOIN media_counts mc
        LEFT JOIN public.profiles p ON m.user_id = p.id
        LEFT JOIN public.interactions l ON l.media_id = m.id AND l.type = 'like'
        WHERE m.user_id = p_current_user_id
        AND (m.title ILIKE '%' || p_keywords || '%')
        GROUP BY m.id, m.created_at, m.title, m.media_url, m.media_type,
                m.duration, m.media_public_id, m.media_cover_url, m.user_id,
                p.id, p.stage_name, p.avatar_url, p.pseudo_url, mc.total
        ORDER BY m.created_at DESC
        LIMIT p_limit
        OFFSET p_offset;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_top_interacting_users(limit_count integer DEFAULT 10)
    RETURNS TABLE(
    user_id uuid,
    stage_name text,
    full_name text,
    avatar_url text,
    label text,
    interaction_score double precision,
    pseudo_url text
    )
    LANGUAGE plpgsql
    AS $function$
    BEGIN
    RETURN QUERY
    SELECT
        p.id AS user_id,
        p.stage_name,
        CASE
        WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL THEN p.first_name || ' ' || p.last_name
        WHEN p.first_name IS NOT NULL THEN p.first_name
        WHEN p.last_name IS NOT NULL THEN p.last_name
        ELSE NULL
        END AS full_name,
        p.avatar_url,
        p.label,
        SUM(
        CASE
            WHEN i.type = 'like' THEN 1
            WHEN i.type = 'share' THEN 3
            WHEN i.type = 'save' THEN 2
            WHEN i.type = 'comment_like' THEN 1
            WHEN i.type = 'read' THEN 0.5
            WHEN i.type = 'comment' THEN 2
            ELSE 0
        END
        )::double precision AS interaction_score,
        p.pseudo_url
    FROM
        interactions i
    JOIN
        posts po ON i.post_id = po.id
    JOIN
        profiles p ON po.user_id = p.id
    GROUP BY
        p.id, p.stage_name, p.first_name, p.last_name, p.avatar_url, p.label, p.pseudo_url
    ORDER BY
        interaction_score DESC
    LIMIT limit_count;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_weekly_ranking(
    p_week_start date DEFAULT (date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone))::date
    )
    RETURNS TABLE(
    user_id uuid,
    points_earned bigint,
    rank bigint
    )
    LANGUAGE plpgsql
    AS $function$
    BEGIN
        RETURN QUERY
        WITH weekly_points AS (
            SELECT
                ph.user_id,
                SUM(ph.points_change) as total_points
            FROM points_history ph
            WHERE ph.created_at >= p_week_start
            AND ph.created_at < p_week_start + INTERVAL '7 days'
            GROUP BY ph.user_id
            HAVING SUM(ph.points_change) > 0
        )
        SELECT
            wp.user_id,
            wp.total_points as points_earned,
            RANK() OVER (ORDER BY wp.total_points DESC) as rank
        FROM weekly_points wp
        INNER JOIN profiles p ON p.id = wp.user_id
        WHERE p.points >= 150;  -- Garder la règle des utilisateurs Bronze+
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_medias(
    p_current_user_id uuid DEFAULT NULL::uuid,
    p_media_type media_type DEFAULT NULL::media_type,
    p_search_term text DEFAULT NULL::text,
    p_page integer DEFAULT 1,
    p_limit integer DEFAULT 10
    )
    RETURNS TABLE(
    id uuid,
    title text,
    media_url text,
    media_type media_type,
    duration integer,
    media_public_id text,
    created_at timestamp with time zone,
    profile jsonb,
    likes bigint,
    is_liked boolean,
    is_followed boolean
    )
    LANGUAGE plpgsql
    AS $function$
    DECLARE
        v_offset INTEGER := (p_page - 1) * p_limit;
    BEGIN
        RETURN QUERY
        WITH media_results AS (
            SELECT
                m.id,
                m.title,
                m.media_url,
                m.media_type,
                CAST(m.duration AS INTEGER),
                m.media_public_id,
                m.created_at,
                pr.id as profile_id,
                pr.stage_name,
                pr.avatar_url,
                pr.pseudo_url
            FROM medias m
            JOIN posts_medias pm ON m.id = pm.media_id
            JOIN posts p ON pm.post_id = p.id
            JOIN profiles pr ON p.user_id = pr.id
            WHERE
                (p_media_type IS NULL OR m.media_type = p_media_type)
                AND (
                    p_search_term IS NULL
                    OR m.title ILIKE '%' || p_search_term || '%'
                    OR pr.stage_name ILIKE '%' || p_search_term || '%'
                )
        )
        SELECT
            mr.id,
            mr.title,
            mr.media_url,
            mr.media_type,
            mr.duration,
            mr.media_public_id,
            mr.created_at,
            jsonb_build_object(
                'id', mr.profile_id,
                'stage_name', mr.stage_name,
                'avatar_url', mr.avatar_url,
                'pseudo_url', mr.pseudo_url
            ) as profile,
            COALESCE(
                (SELECT COUNT(*)
                FROM interactions i
                WHERE i.media_id = mr.id AND i.type = 'like'),
                0
            ) as likes,
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM interactions i
                    WHERE i.media_id = mr.id
                    AND i.user_id = p_current_user_id
                    AND i.type = 'like'
                )),
                FALSE
            ) as is_liked,
            COALESCE(
                (SELECT EXISTS (
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_id = p_current_user_id
                    AND f.following_id = mr.profile_id
                )),
                FALSE
            ) as is_followed
        FROM media_results mr
        ORDER BY mr.created_at DESC
        LIMIT p_limit
        OFFSET v_offset;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.get_challenge_votes(_challenge_id uuid)

    RETURNS TABLE(participation_id uuid, total_points bigint, voters_count bigint, average_points numeric, avg_technique numeric, avg_originalite numeric, avg_interpretation numeric, jury_votes_count bigint)

    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
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
    $function$;

    CREATE OR REPLACE FUNCTION public.exec_sql(sql_statement text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    EXECUTE sql_statement;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.add_user_points(p_user_id uuid, p_points integer, p_reason text)
    RETURNS boolean
    LANGUAGE plpgsql
    AS $function$
    BEGIN
    -- Vérifier que l'utilisateur existe
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;

    -- Vérifier que l'utilisateur existe dans profiles
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User ID % not found in profiles', p_user_id;
    END IF;

    -- Log pour le débogage
    RAISE NOTICE 'Updating points for user %: adding % points', p_user_id, p_points;

    -- Mettre à jour les points de l'utilisateur avec la clause WHERE
    UPDATE profiles 
    SET points = COALESCE(points, 0) + p_points
    WHERE id = p_user_id;

    -- Vérifier que la mise à jour a affecté une ligne
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Update failed for user %', p_user_id;
    END IF;

    -- Enregistrer dans l'historique
    INSERT INTO points_history (
        user_id,
        points_change,
        reason
    ) VALUES (
        p_user_id,
        p_points,
        p_reason
    );

    RETURN TRUE;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.add_points_for_media(p_media_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    AS $function$
    DECLARE
        v_user_id UUID;
        v_current_date DATE;
    BEGIN
        -- Obtenir l'utilisateur qui a posté le média
        SELECT user_id INTO v_user_id
        FROM medias
        WHERE id = p_media_id;

        IF v_user_id IS NULL THEN
            RETURN FALSE;
        END IF;

        -- Obtenir la date courante
        v_current_date := CURRENT_DATE;

        -- Essayer d'insérer dans daily_media_uploads
        BEGIN
            INSERT INTO daily_media_uploads (user_id, media_id, upload_date)
            VALUES (v_user_id, p_media_id, v_current_date);

            -- Si l'insertion réussit, ajouter les points
            PERFORM add_user_points(
                v_user_id,
                10,
                'Publication du média ' || p_media_id::TEXT || ' (limite journalière)'
            );

            RETURN TRUE;
        EXCEPTION WHEN unique_violation THEN
            -- L'utilisateur a déjà publié un média aujourd'hui
            RETURN FALSE;
        END;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.add_points_for_like_dep(p_media_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    AS $function$
    DECLARE
    v_media_owner_id UUID;
    BEGIN
    -- Vérifier si le média existe et obtenir son propriétaire
    SELECT user_id INTO v_media_owner_id
    FROM medias
    WHERE id = p_media_id;

    IF v_media_owner_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Ajouter les points au propriétaire du média
    PERFORM add_user_points(
        v_media_owner_id,
        2,
        'Like reçu sur le média ' || p_media_id::TEXT
    );
    
    RETURN TRUE;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.add_points_for_like(p_media_id uuid, p_user_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    AS $function$
    DECLARE
        v_media_owner_id UUID;
    BEGIN
        -- Vérifier si le média existe et obtenir son propriétaire
        SELECT user_id INTO v_media_owner_id
        FROM medias
        WHERE id = p_media_id;

        IF v_media_owner_id IS NULL THEN
            RETURN FALSE;
        END IF;

        -- Essayer d'insérer dans unique_likes (échouera si déjà liké)
        BEGIN
            INSERT INTO unique_likes (media_id, user_id)
            VALUES (p_media_id, p_user_id);

            -- Si l'insertion réussit, ajouter les points
            PERFORM add_user_points(
                v_media_owner_id,
                3,
                'Like unique reçu sur le média ' || p_media_id::TEXT
            );

            RETURN TRUE;
        EXCEPTION WHEN unique_violation THEN
            -- Le like existe déjà, ne rien faire
            RETURN FALSE;
        END;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.add_points_for_commenting(p_comment_id uuid, p_user_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    AS $function$
    DECLARE
        v_comment_count INTEGER;
        v_current_date DATE;
    BEGIN
        -- Obtenir la date courante
        v_current_date := CURRENT_DATE;

        -- Compter les commentaires de l'utilisateur aujourd'hui
        SELECT COUNT(*) INTO v_comment_count
        FROM daily_comments
        WHERE user_id = p_user_id
        AND comment_date = v_current_date;

        -- Vérifier si l'utilisateur n'a pas déjà atteint la limite journalière
        IF v_comment_count >= 3 THEN
            RETURN FALSE;
        END IF;

        -- Enregistrer le commentaire dans daily_comments
        INSERT INTO daily_comments (user_id, comment_id, comment_date)
        VALUES (p_user_id, p_comment_id, v_current_date);

        -- Ajouter les points à l'utilisateur qui commente
        PERFORM add_user_points(
            p_user_id,
            2,
            'Commentaire créé (ID: ' || p_comment_id::TEXT || ')'
        );

        RETURN TRUE;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.add_points_for_comment(p_comment_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    AS $function$
    DECLARE
        v_media_owner_id UUID;
        v_comment_text TEXT;
        v_media_id UUID;
    BEGIN
        -- Récupérer le texte du commentaire et le média associé
        SELECT content, media_id INTO v_comment_text, v_media_id
        FROM comments
        WHERE id = p_comment_id;

        IF v_comment_text IS NULL OR v_media_id IS NULL THEN
            RETURN FALSE;
        END IF;

        -- Vérifier si le commentaire fait plus de 10 caractères
        IF LENGTH(TRIM(v_comment_text)) <= 10 THEN
            RETURN FALSE;
        END IF;

        -- Récupérer le propriétaire du média
        SELECT user_id INTO v_media_owner_id
        FROM medias
        WHERE id = v_media_id;

        IF v_media_owner_id IS NULL THEN
            RETURN FALSE;
        END IF;

        -- -- Vérifier si des points ont déjà été attribués pour ce commentaire reçu
        -- IF EXISTS (
        --     SELECT 1 FROM points_history
        --     WHERE reason LIKE 'Commentaire reçu%'
        --     AND reason LIKE '%' || p_comment_id::TEXT || '%'
        -- ) THEN
        --     RETURN FALSE;
        -- END IF;

        -- Ajouter les points au propriétaire du média via add_user_points
        PERFORM add_user_points(
            v_media_owner_id,
            5,
            'Commentaire reçu (ID: ' || p_comment_id::TEXT || ')'
        );

        RETURN TRUE;
    END;
    $function$;

    CREATE OR REPLACE FUNCTION public.add_points_for_challenge_participation(p_media_id uuid, p_challenge_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    AS $function$
    DECLARE
    v_user_id UUID;
    BEGIN
    -- Obtenir l'utilisateur qui participe
    SELECT user_id INTO v_user_id
    FROM medias
    WHERE id = p_media_id;

    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Ajouter les points
    PERFORM add_user_points(
        v_user_id,
        5,
        'Participation au challenge ' || p_challenge_id::TEXT
    );

    RETURN TRUE;
    END;
    $function$;

    -- Section 4: Fonctions de gestion des classements
    CREATE OR REPLACE FUNCTION get_weekly_rankings(
        p_start_date date DEFAULT date_trunc('week', CURRENT_DATE)::date,
        p_end_date date DEFAULT (date_trunc('week', CURRENT_DATE) + interval '6 days')::date
    )
    RETURNS TABLE (
        user_id uuid,
        stage_name text,
        avatar_url text,
        points integer,
        rank bigint
    ) AS $$
    BEGIN
        RETURN QUERY
        WITH weekly_points AS (
            SELECT
                ph.user_id,
                pr.stage_name,
                pr.avatar_url,
                SUM(ph.points_change) as total_points
            FROM points_history ph
            JOIN profiles pr ON ph.user_id = pr.id
            WHERE ph.created_at::date BETWEEN p_start_date AND p_end_date
            GROUP BY ph.user_id, pr.stage_name, pr.avatar_url
            HAVING SUM(ph.points_change) > 0
        )
        SELECT
            wp.user_id,
            wp.stage_name,
            wp.avatar_url,
            wp.total_points::integer as points,
            RANK() OVER (ORDER BY wp.total_points DESC) as rank
        FROM weekly_points wp
        ORDER BY wp.total_points DESC;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Fonction pour rafraîchir les classements hebdomadaires
   
    CREATE OR REPLACE FUNCTION public.refresh_weekly_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Rafraîchir la vue de manière non concurrente pour le premier chargement
    IF NOT EXISTS (SELECT 1 FROM weekly_rankings_view LIMIT 1) THEN
        REFRESH MATERIALIZED VIEW weekly_rankings_view;
    ELSE
        -- Rafraîchir la vue de manière concurrente (ne bloque pas les lectures)
        REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_rankings_view;
    END IF;
    
    -- Analyser la vue pour mettre à jour les statistiques
    ANALYZE weekly_rankings_view;
END;
$$;

    -- Section 5: Fonctions de gestion des challenges
    CREATE OR REPLACE FUNCTION get_challenge_votes(
        p_challenge_id uuid,
        p_participation_id uuid DEFAULT NULL,
        p_voter_id uuid DEFAULT NULL
    )
    RETURNS TABLE (
        id uuid,
        challenge_id uuid,
        participation_id uuid,
        voter_id uuid,
        points integer,
        created_at timestamptz,
        updated_at timestamptz,
        vote_type text,
        technique_points integer,
        originalite_points integer,
        interpretation_points integer,
        voter_stage_name text,
        voter_avatar_url text
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT
            cv.id,
            cv.challenge_id,
            cv.participation_id,
            cv.voter_id,
            cv.points,
            cv.created_at,
            cv.updated_at,
            cv.vote_type,
            cv.technique_points,
            cv.originalite_points,
            cv.interpretation_points,
            p.stage_name as voter_stage_name,
            p.avatar_url as voter_avatar_url
        FROM challenge_votes cv
        LEFT JOIN profiles p ON cv.voter_id = p.id
        WHERE
            cv.challenge_id = p_challenge_id
            AND (p_participation_id IS NULL OR cv.participation_id = p_participation_id)
            AND (p_voter_id IS NULL OR cv.voter_id = p_voter_id)
        ORDER BY cv.created_at DESC;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Fonction de déclencheur pour mettre à jour le champ updated_at
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$;

    -- Fonction de déclencheur spécifique pour les challenges
    CREATE OR REPLACE FUNCTION public.update_challenges_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$;

    -- Fonction de déclencheur spécifique pour les profils beatmakers
    CREATE OR REPLACE FUNCTION public.update_profiles_beatmakers_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$;

    -- Fonction de déclencheur avec timezone UTC
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        NEW.updated_at = TIMEZONE('utc', NOW());
        RETURN NEW;
    END;
    $$;

    -- Fonction pour obtenir la version de PostgreSQL
    CREATE OR REPLACE FUNCTION public.version()
    RETURNS text
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
        SELECT version();
    $$;

    -- Créer un déclencheur pour les tables principales
    CREATE TRIGGER set_posts_updated_at
        BEFORE UPDATE ON posts
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_medias_updated_at
        BEFORE UPDATE ON medias
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_interactions_updated_at
        BEFORE UPDATE ON interactions
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_challenges_updated_at
        BEFORE UPDATE ON challenges
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_follows_updated_at
        BEFORE UPDATE ON follows
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_comments_updated_at
        BEFORE UPDATE ON comments
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_challenge_votes_updated_at
        BEFORE UPDATE ON challenge_votes
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_points_history_updated_at
        BEFORE UPDATE ON points_history
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_weekly_rankings_updated_at
        BEFORE UPDATE ON weekly_rankings
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_daily_media_uploads_updated_at
        BEFORE UPDATE ON daily_media_uploads
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_daily_comments_updated_at
        BEFORE UPDATE ON daily_comments
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_unique_likes_updated_at
        BEFORE UPDATE ON unique_likes
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_posts_medias_updated_at
        BEFORE UPDATE ON posts_medias
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();


    -- ==============================================================================
    -- Function to handle new user creation and assign initial points
    -- ==============================================================================
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $function$
    DECLARE
        initial_points INTEGER := 5; -- 5 points for signing up
    BEGIN
        -- Insert a row into public.profiles when a new user is created
        INSERT INTO public.profiles (
            id,
            created_at,
            updated_at,
            bio,
            stage_name,
            avatar_url,
            cover_url,
            first_name,
            last_name,
            country,
            gender,
            phone,
            label,
            musical_interests,
            talents,
            social_links,
            points
        )
        VALUES (
            NEW.id,            -- id from auth.users
            NOW(),             -- created_at
            NOW(),             -- updated_at
            NULL,              -- bio
            NULL,              -- stage_name
            NULL,              -- avatar_url
            NULL,              -- cover_url
            NULL,              -- first_name
            NULL,              -- last_name
            NULL,              -- country
            NULL,              -- gender
            NULL,              -- phone
            NULL,              -- label
            '[]'::jsonb,       -- empty musical_interests array
            '[]'::jsonb,       -- empty talents array
            '{}'::jsonb,       -- empty social_links object
            initial_points     -- award initial points
        );

        -- Record the points award in points_history
        INSERT INTO public.points_history (
            user_id,
            points_change,
            reason,
            created_at
        )
        VALUES (
            NEW.id,
            initial_points,
            'Sign up bonus',
            NOW()
        );

        RETURN NEW;
    END;
    $function$;

    -- ==============================================================================
    -- Trigger to execute handle_new_user on new user creation in auth.users
    -- ==============================================================================
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


    -- ==============================================================================
    -- Function to handle weekly rankings refresh, preventing too frequent updates
    -- ==============================================================================
    CREATE OR REPLACE FUNCTION public.handle_rankings_refresh()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $function$
    DECLARE
    min_refresh_interval interval := '10 seconds'::interval;
    current_state record;
    BEGIN
    -- Récupérer l'état actuel
    SELECT * INTO current_state FROM weekly_rankings_refresh_state LIMIT 1;

    -- Si un rafraîchissement est déjà en cours, sortir
    IF current_state.is_refreshing THEN
        RAISE NOTICE 'Refresh already in progress.';
        RETURN NULL;
    END IF;

    -- Si le dernier rafraîchissement est trop récent, sortir
    IF current_state.last_refresh + min_refresh_interval > now() THEN
        RAISE NOTICE 'Last refresh was too recent.';
        RETURN NULL;
    END IF;

    -- Marquer comme en cours de rafraîchissement
    -- Utiliser une approche atomique pour éviter les conditions de concurrence
    UPDATE weekly_rankings_refresh_state
    SET is_refreshing = true
    WHERE last_refresh = current_state.last_refresh
        AND is_refreshing = false; -- S'assurer qu'il n'a pas été modifié entre-temps

    -- Vérifier si la mise à jour a réussi (une ligne affectée)
    IF NOT FOUND THEN
        RAISE NOTICE 'Failed to acquire lock for refresh, another process might have started.';
        RETURN NULL;
    END IF;

    -- Rafraîchir la vue ou exécuter la logique de rafraîchissement
    -- Supposant que refresh_weekly_rankings() existe
    PERFORM public.refresh_weekly_rankings(); 

    -- Mettre à jour le timestamp et réinitialiser le flag
    UPDATE weekly_rankings_refresh_state
    SET last_refresh = now(),
        is_refreshing = false
    WHERE is_refreshing = true; -- S'assurer qu'on met à jour le bon état

    RETURN NULL;
    END;
    $function$;


    -- ==============================================================================
    -- Function to increment participants_count for a challenge
    -- ==============================================================================
    CREATE OR REPLACE FUNCTION public.increment_challenge_participants(p_challenge_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    UPDATE public.challenges
    SET participants_count = participants_count + 1
    WHERE id = p_challenge_id;
    END;
    $function$;


    -- ==============================================================================
    -- Function to check if a user is following another user
    -- ==============================================================================
    CREATE OR REPLACE FUNCTION public.is_following(p_follower_id uuid, p_following_id uuid)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    AS $function$
        SELECT EXISTS (
            SELECT 1
            FROM public.follows
            WHERE follower_id = p_follower_id
            AND following_id = p_following_id
        );
    $function$;

    COMMIT;
