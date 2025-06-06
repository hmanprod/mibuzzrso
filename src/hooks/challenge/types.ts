

export interface MediaPlayerRef {
  seekToTime: (time: number) => void;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
  created_at: string;
  end_at: string;
  winner_displayname?: string;
  participants_count: number;
  likes?: number;
  is_liked?: boolean;
  winning_prize?: string;
  creator?: {
    id: string;
    profile?: {
      id: string;
      stage_name?: string;
      avatar_url?: string;
      pseudo_url?: string;
    };
  };
  is_followed?: boolean;
  voting_type?: 'public' | 'jury';
}

export interface ChallengeMedia {
  id: string;
  position: number;
  media: {
    id: string;
    media_type: 'audio' | 'video';
    media_url: string;
    media_cover_url?: string;
    media_public_id: string;
    duration?: number;
    title?: string;
    description?: string;
    user_id: string;
    created_at: string;
    updated_at: string;
  };
  comments?: Array<{
    id: string;
    timestamp: number;
    content: string;
    author: {
      id: string;
      stage_name: string;
      avatar_url: string | null;
      username: string;
    };
  }>;
}

export interface Participation {
  id: string;
  content: string;
  created_at: string;
  user: { id: string; email: string };
  profile: {
    id: string;
    username: string;
    stage_name: string;
    avatar_url: string | null;
    pseudo_url: string;
  };
  medias: Array<{
    id: string;
    position: number;
    media: {
      id: string;
      media_type: 'audio' | 'video';
      media_url: string;
      media_public_id: string;
      duration?: number;
    };
  }>;
  has_voted?: boolean;
  vote_points?: number;
}

export interface ChallengeVote {
  participation_id: string;
  total_points: string;
  voters_count: string;
  average_points: string;
}

export interface ChallengeState {
  challenge: Challenge | null;
  medias: ChallengeMedia[];
  participations: Participation[];
  votes: Record<string, {
    total_points: number;
    voters_count: number;
    average_points: number;
  }>;
  loading: boolean;
  error: string | null;
  isLiked: boolean;
  likesCount: number;
  currentPlaybackTime: number;
  selectedParticipation: Participation | null;
  isJury: boolean;
  isFollowLoading: boolean;
  showVoteModal: boolean;
  showJuryVoteModal: boolean;
  setChallenge: (challenge: Challenge) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setIsLiked: (isLiked: boolean) => void;
  setLikesCount: (likesCount: number) => void;
  setCurrentPlaybackTime: (currentPlaybackTime: number) => void;
  setSelectedParticipation: (selectedParticipation: Participation | null) => void;
  setIsJury: (isJury: boolean) => void;
  setVotes: (votes: Record<string, { total_points: number; voters_count: number; average_points: number }>) => void;
  setMedias: (medias: ChallengeMedia[]) => void;
  setParticipations: (participations: Participation[]) => void;
  setIsFollowLoading: (isFollowLoading: boolean) => void;
  setShowVoteModal: (showVoteModal: boolean) => void;
  setShowJuryVoteModal: (showJuryVoteModal: boolean) => void;
}

export interface ChallengeActions {
  handleLike: () => void;
  handleShare: () => void;
  handleFollow: () => void;
  handleParticipate: (file: File) => Promise<void>;
  handleVote: (points: number) => Promise<void>;
  handleJuryVote: (criteria: {
    technique: number;
    originalite: number;
    interpretation: number;
    overall: number;
  }) => Promise<void>;
  setSelectedParticipation: (participation: Participation | null) => void;
  handleUpdateParticipations: (participations: Participation[]) => void;
  loadData: () => void;
}
