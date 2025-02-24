export type MediaType = 'audio' | 'video';

export interface Media {
  id: string;
  created_at: string;
  updated_at: string;
  media_type: MediaType;
  media_url: string;
  media_public_id: string;
  duration?: number;
  title?: string;
  description?: string;
  user_id: string;
}

export interface Post {
  id: string;
  created_at: string;
  updated_at: string;
  content?: string;
  user_id: string;
}

export interface PostMedia {
  id: string;
  created_at: string;
  post_id: string;
  media_id: string;
  position: number;
}

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  stage_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  bio: string | null;
  label: string | null;
  avatar_url: string | null;
  musical_interests: string[] | null;
  talents: string[] | null;
  social_links: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    spotify?: string;
    moozik?: string;
    youtube?: string;
    website?: string;
  } | null;
}
