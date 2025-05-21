-- Create enum types
-- First drop existing enum type if it exists
DROP TYPE IF EXISTS post_type CASCADE;

-- Recreate the enum with all values
CREATE TYPE post_type AS ENUM ('post', 'challenge', 'challenge_participation', 'feedback','feed');
CREATE TYPE media_type AS ENUM ('audio', 'video');
CREATE TYPE interaction_type AS ENUM ('like', 'share', 'save', 'comment_like', 'read', 'comment');

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create medias table
CREATE TABLE medias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    media_type media_type NOT NULL,
    media_url TEXT NOT NULL,
    media_public_id TEXT NOT NULL,
    duration DECIMAL(10, 2),  -- Duration in seconds for audio/video
    title TEXT,
    description TEXT
    media_cover_url TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    CONSTRAINT valid_media CHECK (
        media_url ~ '^https://.*cloudinary\.com/.*$'
    )
);

-- Create posts table
CREATE TABLE posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    post_type post_type NOT NULL,
    content TEXT,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create posts_medias junction table
CREATE TABLE posts_medias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES medias(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, -- To maintain the order of media in a post
    
    CONSTRAINT unique_post_media UNIQUE (post_id, media_id),
    CONSTRAINT unique_post_media_position UNIQUE (post_id, position)
);

-- Create comments table
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    content TEXT NOT NULL,
    player_time DECIMAL(10, 2),  -- Current time in the player when comment was made
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES medias(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE  -- For replies to comments
);

-- Create interactions table
CREATE TABLE interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    type interaction_type NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    media_id UUID REFERENCES medias(id) ON DELETE CASCADE,
    
    CONSTRAINT unique_interaction CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL AND media_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL AND media_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NULL AND media_id IS NOT NULL)
    )
);

-- Create unique indexes for interactions
CREATE UNIQUE INDEX idx_unique_user_post_interaction 
ON interactions (user_id, post_id, type) 
WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX idx_unique_user_comment_interaction 
ON interactions (user_id, comment_id, type) 
WHERE comment_id IS NOT NULL;

CREATE UNIQUE INDEX idx_unique_user_media_interaction 
ON interactions (user_id, media_id, type) 
WHERE media_id IS NOT NULL AND type != 'read';

-- Create indexes
CREATE INDEX idx_medias_user_id ON medias(user_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_medias_post_id ON posts_medias(post_id);
CREATE INDEX idx_posts_medias_media_id ON posts_medias(media_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_media_id ON comments(media_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_post_id ON interactions(post_id);
CREATE INDEX idx_interactions_comment_id ON interactions(comment_id);
CREATE INDEX idx_interactions_media_id ON interactions(media_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_medias_updated_at
    BEFORE UPDATE ON medias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) policies
ALTER TABLE medias ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts_medias ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for medias
CREATE POLICY "Medias are viewable by everyone"
    ON medias FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own medias"
    ON medias FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medias"
    ON medias FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medias"
    ON medias FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS policies for posts
CREATE POLICY "Posts are viewable by everyone"
    ON posts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own posts"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
    ON posts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS policies for posts_medias
CREATE POLICY "Posts medias are viewable by everyone"
    ON posts_medias FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert into posts_medias for their own posts"
    ON posts_medias FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            WHERE id = posts_medias.post_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update posts_medias for their own posts"
    ON posts_medias FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE id = posts_medias.post_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete from posts_medias for their own posts"
    ON posts_medias FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE id = posts_medias.post_id
            AND user_id = auth.uid()
        )
    );

-- RLS policies for comments
CREATE POLICY "Comments are viewable by everyone"
    ON comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own comments"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS policies for interactions
CREATE POLICY "Interactions are viewable by everyone"
    ON interactions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage their own interactions"
    ON interactions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
