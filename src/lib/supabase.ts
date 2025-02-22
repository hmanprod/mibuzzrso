import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  bio: string | null;
  genre: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  gender: string | null;
  phone: string | null;
  stage_name: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  activities: any | null;
};
