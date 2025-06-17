-- Modify the comments table to allow null values for media_id
ALTER TABLE comments ALTER COLUMN media_id DROP NOT NULL;

-- Add post_id column to reference posts table for feedback comments
ALTER TABLE comments ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE;
