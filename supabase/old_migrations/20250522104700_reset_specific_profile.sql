            -- Migration pour réinitialiser un profil spécifique à son état initial
            -- Cette migration réinitialise le profil de l'utilisateur c4ca416b-b666-45c1-8830-0730b20e472d
            -- comme s'il venait d'être créé par le trigger handle_new_user()

            -- Commencer une transaction
            BEGIN;

            -- Vérifier si l'utilisateur existe dans auth.users
            DO $$
            DECLARE
                user_exists BOOLEAN;
            BEGIN
                SELECT EXISTS(
                    SELECT 1 FROM auth.users WHERE id = 'c4ca416b-b666-45c1-8830-0730b20e472d'
                ) INTO user_exists;
                
                IF NOT user_exists THEN
                    RAISE EXCEPTION 'L''utilisateur c4ca416b-b666-45c1-8830-0730b20e472d n''existe pas dans auth.users';
                END IF;
            END $$;

            -- Supprimer d'abord toutes les données liées à ce profil
            -- (Ceci est similaire à ce qui est fait dans 20250520_remove_test_users_content.sql)

            -- Créer une table temporaire pour stocker l'ID de l'utilisateur
            CREATE TEMP TABLE user_to_reset (
                user_id UUID NOT NULL,
                CONSTRAINT user_to_reset_pkey PRIMARY KEY (user_id)
            );

            -- Insérer l'ID de l'utilisateur
            INSERT INTO user_to_reset (user_id) VALUES ('c4ca416b-b666-45c1-8830-0730b20e472d');

            -- 1. Supprimer les interactions liées aux posts de l'utilisateur
            DELETE FROM interactions i
            WHERE i.post_id IN (
                SELECT p.id 
                FROM posts p
                WHERE p.user_id IN (SELECT user_id FROM user_to_reset)
            );

            -- 2. Supprimer les interactions liées aux commentaires de l'utilisateur
            DELETE FROM interactions i
            WHERE i.comment_id IN (
                SELECT c.id 
                FROM comments c
                WHERE c.user_id IN (SELECT user_id FROM user_to_reset)
            );

            -- 3. Supprimer les interactions liées aux médias de l'utilisateur
            DELETE FROM interactions i
            WHERE i.media_id IN (
                SELECT m.id 
                FROM medias m
                WHERE m.user_id IN (SELECT user_id FROM user_to_reset)
            );

            -- 4. Supprimer les daily_comments de l'utilisateur
            DELETE FROM daily_comments dc
            WHERE dc.user_id IN (SELECT user_id FROM user_to_reset)
            OR dc.comment_id IN (
                SELECT c.id
                FROM comments c
                WHERE c.user_id IN (SELECT user_id FROM user_to_reset)
            );

            -- 5. Supprimer les commentaires sur les médias de l'utilisateur
            DELETE FROM comments c
            WHERE c.media_id IN (
                SELECT m.id 
                FROM medias m
                WHERE m.user_id IN (SELECT user_id FROM user_to_reset)
            );

            -- 6. Supprimer les liens posts-médias
            DELETE FROM posts_medias pm
            WHERE pm.post_id IN (
                SELECT p.id 
                FROM posts p
                WHERE p.user_id IN (SELECT user_id FROM user_to_reset)
            ) OR pm.media_id IN (
                SELECT m.id 
                FROM medias m
                WHERE m.user_id IN (SELECT user_id FROM user_to_reset)
            );

            -- 7. Supprimer les unique_likes
            DELETE FROM unique_likes ul
            WHERE ul.user_id IN (SELECT user_id FROM user_to_reset)
            OR ul.media_id IN (
                SELECT m.id
                FROM medias m
                WHERE m.user_id IN (SELECT user_id FROM user_to_reset)
            );

            -- 8. Supprimer les daily_media_uploads
            DELETE FROM daily_media_uploads dmu
            WHERE dmu.user_id IN (SELECT user_id FROM user_to_reset)
            OR dmu.media_id IN (
                SELECT m.id
                FROM medias m
                WHERE m.user_id IN (SELECT user_id FROM user_to_reset)
            );

            -- 9. Supprimer les médias
            DELETE FROM medias m
            WHERE m.user_id IN (SELECT user_id FROM user_to_reset);

            -- 10. Supprimer les posts
            DELETE FROM posts p
            WHERE p.user_id IN (SELECT user_id FROM user_to_reset);

            -- 11. Supprimer l'historique des points
            DELETE FROM points_history
            WHERE user_id IN (SELECT user_id FROM user_to_reset);

            -- 12. Supprimer les participations aux challenges
            DELETE FROM challenge_participations
            WHERE user_id IN (SELECT user_id FROM user_to_reset);

            -- 13. Supprimer les votes aux challenges
            DELETE FROM challenge_votes
            WHERE voter_id IN (SELECT user_id FROM user_to_reset);

            -- 14. Réinitialiser le profil à son état initial
            UPDATE profiles
            SET 
                bio = NULL,
                stage_name = NULL,
                avatar_url = NULL,
                cover_url = NULL,
                first_name = NULL,
                last_name = NULL,
                country = NULL,
                gender = NULL,
                phone = NULL,
                label = NULL,
                musical_interests = '[]'::jsonb,
                talents = '[]'::jsonb,
                social_links = '{}'::jsonb,
                points = 0,
                pseudo_url = NULL,
                updated_at = NOW()
            WHERE id IN (SELECT user_id FROM user_to_reset);

            -- Supprimer la table temporaire
            DROP TABLE user_to_reset;

            -- Rafraîchir les classements
            SELECT refresh_weekly_rankings();

            -- Valider la transaction
            COMMIT;
