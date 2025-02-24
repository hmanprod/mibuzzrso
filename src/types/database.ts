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
