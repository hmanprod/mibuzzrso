export interface Feedback {
  id: string;
  content: string;
  post_type: 'feedback';
  user_id: string;
  created_at: string;
  profile: {
    id: string;
    stage_name: string;
    avatar_url: string | null;
  };
  is_liked?: boolean;
  likes?: number;
  comments_count?: number;
}
