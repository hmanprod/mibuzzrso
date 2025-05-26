    -- Add title and author fields to medias table
    ALTER TABLE medias 
    ADD COLUMN title TEXT,
    ADD COLUMN author TEXT;
