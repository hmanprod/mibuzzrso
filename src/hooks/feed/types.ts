import { Media } from "@/types/database";
import { Comment } from "./comment.types";

export interface FeedPostState {
    isLiked: boolean;
    likesCount: number;
    isLikeProcessing: boolean;
    showComments: boolean;
    comments: Comment[];
    commentsCount: number;
    currentPlaybackTime: number;
    showDeleteDialog: boolean;
    showEditDialog: boolean;
    isFollowLoading: boolean;
    dropdownOpen: boolean;
    isDeleted: boolean;
    audioPlayerRef: React.RefObject<MediaPlayerRef | null>;
    videoPlayerRef: React.RefObject<MediaPlayerRef | null>;
    mediaItem: Media;
    setIsLiked: (isLiked: boolean) => void;
    setLikesCount: (likesCount: number) => void;
    setIsLikeProcessing: (isLikeProcessing: boolean) => void;
    setShowComments: (showComments: boolean) => void;
    setComments: (comments: Comment[]) => void;
    setCommentsCount: (commentsCount: number) => void;
    setCurrentPlaybackTime: (currentPlaybackTime: number) => void;
    setShowDeleteDialog: (showDeleteDialog: boolean) => void;
    setShowEditDialog: (showEditDialog: boolean) => void;
    setIsFollowLoading: (isFollowLoading: boolean) => void;
    setDropdownOpen: (dropdownOpen: boolean) => void;
    setIsDeleted: (isDeleted: boolean) => void;
}

export interface FeedPostActions {
    handleSetLikesCount: (newIsLiked: boolean) => void;
    seekToTime: (time: number) => void;
    handleFollow: () => void;
    handlePostDeleted: () => void;
    handlePostUpdated: () => void;
    handleLike: () => Promise<void>;
    fetchComments: () => Promise<void>;
}

export interface MediaPlayerRef {
    seekToTime: (time: number) => void;
}

