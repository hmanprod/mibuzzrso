-- Drop existing indexes and constraints if they exist
DROP INDEX IF EXISTS public.idx_unique_user_media_interaction;
DROP INDEX IF EXISTS public.idx_interactions_user_id;
DROP INDEX IF EXISTS public.idx_interactions_post_id;
DROP INDEX IF EXISTS public.idx_unique_user_post_interaction;
DROP INDEX IF EXISTS public.idx_unique_user_comment_interaction;
DROP INDEX IF EXISTS public.idx_interactions_comment_id;
DROP INDEX IF EXISTS public.idx_interactions_media_id;

-- Drop the table if it exists
DROP TABLE IF EXISTS public.interactions;

-- Create the interactions table with the new schema
CREATE TABLE public.interactions (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  type public.interaction_type not null,
  user_id uuid not null,
  post_id uuid null,
  comment_id uuid null,
  media_id uuid null,
  constraint interactions_pkey primary key (id),
  constraint interactions_comment_id_fkey foreign KEY (comment_id) references comments (id) on delete CASCADE,
  constraint interactions_media_id_fkey foreign KEY (media_id) references medias (id) on update CASCADE on delete CASCADE,
  constraint interactions_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint interactions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint unique_interaction CHECK (
    (
      (post_id is not null)
      and (comment_id is null)
      and (media_id is null)
    )
    or (
      (post_id is null)
      and (comment_id is not null)
      and (media_id is null)
    )
    or (
      (post_id is null)
      and (comment_id is null)
      and (media_id is not null)
    )
  )
) TABLESPACE pg_default;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_media_interaction ON public.interactions USING btree (user_id, media_id, type) TABLESPACE pg_default
WHERE
  (
    (media_id is not null)
    and (type <> 'read'::interaction_type)
  );

CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_interactions_post_id ON public.interactions USING btree (post_id) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_post_interaction ON public.interactions USING btree (user_id, post_id, type) TABLESPACE pg_default
WHERE
  (post_id is not null);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_comment_interaction ON public.interactions USING btree (user_id, comment_id, type) TABLESPACE pg_default
WHERE
  (comment_id is not null);

CREATE INDEX IF NOT EXISTS idx_interactions_comment_id ON public.interactions USING btree (comment_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_interactions_media_id ON public.interactions USING btree (media_id) TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Interactions are viewable by everyone"
    ON public.interactions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own interactions"
    ON public.interactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
    ON public.interactions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
    ON public.interactions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
