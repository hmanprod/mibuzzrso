-- Add genres column to profiles table
ALTER TABLE profiles
ADD COLUMN genres JSONB,
ADD COLUMN label TEXT;

-- Add comment to describe the columns
COMMENT ON COLUMN profiles.genres IS 'Array of musical genres the user is interested in';
COMMENT ON COLUMN profiles.label IS 'Optional label or description for the user profile';
