interface Profile {
    id: string;
    is_admin: boolean;
    avatar_url: string | null;
    pseudo_url: string;
    stage_name: string;
  }
  
  export interface Media {
    id: string;
    title: string;
    duration: number;
    media_url: string;
    created_at: string;
    media_type: string;
    updated_at: string;
    media_cover_url: string;
    media_public_id: string;
  }
  
  export interface PostDataResponse {
    id: string;
    content: string;
    post_type: 'post' | 'feedback' | 'challenge_participation';
    created_at: string;
    updated_at: string;
    user_id: string;
    profile: Profile;
    medias: Media[];
    likes: number;
    is_liked: boolean;
    is_followed: boolean;
    match_source: string;
  }