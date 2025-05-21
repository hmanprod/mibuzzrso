export type MediaType = 'audio' | 'video';
export type InteractionType = 'like' | 'share' | 'save' | 'comment_like' | 'read';
export type ChallengeType = 'remix' | 'live_mix';
export type ChallengeStatus = 'draft' | 'active' | 'completed';

export interface Media {
  id: string;
  title: string;
  media_url: string;
  media_type: MediaType;
  duration: number;
  media_public_id: string;
  media_cover_url?: string;
  created_at: string;
  profile: {
    id: string;
    stage_name: string;
    avatar_url: string;
    pseudo_url: string;
  };
  likes: number;
  is_liked: boolean;
  is_followed: boolean;
}

export interface Post {
  id: string;
  created_at: string;
  updated_at: string;
  content?: string;
  user_id: string;
}

export interface ExtendedPost extends Post {
  profile: ProfilePublic;
  medias: Media[];
  likes: number;
  is_liked: boolean;
  is_followed: boolean;
}

export interface PostMedia {
  id: string;
  created_at: string;
  post_id: string;
  media_id: string;
  position: number;
}

export interface ProfilePublic {
  id: string;
  stage_name: string | null;
  avatar_url: string | null;
  pseudo_url: string;
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
  cover_url: string | null;
  musical_interests: string[] | null;
  talents: string[] | null;
  is_admin: boolean | null;
  points: number;
  pseudo_url: string;
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

export interface Comment {
  id: string;
  created_at: string;
  updated_at: string;
  content: string;
  player_time?: number;
  user_id: string;
  media_id: string;
}

export interface MediaChallenge {
  id: string;
  url: string;
  name: string;
  media_type: MediaType;
  size?: number;
}

export interface Challenge {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  start_at: string;
  end_at: string;
  winning_prize?: string;
  winner_uid?: string;
  winner_displayname?: string;
  participants_count: number;
  likes: number;
  is_liked: boolean;
  is_followed: boolean;
  user_id: string;
  creator?: {
    id: string;
    profile: ProfilePublic | null;
  };
  medias?: {
    id: string;
    challenge_id: string;
    media_id: string;
    position: number;
    created_at: string;
    media: Media;
  }[];
}
