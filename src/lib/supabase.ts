import { createClient } from '@supabase/supabase-js';
import { Profile, Media, Post, PostMedia } from '../types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
      };
      medias: {
        Row: Media;
      };
      posts: {
        Row: Post;
      };
      post_medias: {
        Row: PostMedia;
      };
    };
  };
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
