export interface Comment {
    id: string;
    content: string;
    timestamp: number;
    created_at: string;
    author: {
      id: string;
      stage_name: string;
      avatar_url: string | null;
      username: string;
      pseudo_url: string;
    };
}