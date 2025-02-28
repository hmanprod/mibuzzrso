'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Share2, UserPlus, Check } from 'lucide-react';
import type { Media, Post, Profile } from '@/types/database';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';
import CommentSection from './CommentSection';
import { Avatar } from '../ui/Avatar';
import { toast } from '@/components/ui/use-toast';
import { getCommentsByMediaId, togglePostLike } from '@/app/feed/actions/interaction';
import { followUser, isFollowing } from '@/app/profile/actions/follower';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';

interface ExtendedPost extends Post {
  profile: Profile;
  media: Media[];
  likes: number;
  is_liked: boolean;
}

interface FeedPostProps {
  post: ExtendedPost;
}

interface Comment {
  id: string;
  content: string;
  timestamp: number;
  created_at: string;
  author: {
    id: string;
    stage_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export default function FeedPost({ post }: FeedPostProps) {
  const { user } = useSession();
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isFollowChecked, setIsFollowChecked] = useState(false);
  
  // Define proper types for the refs
  interface MediaPlayerRef {
    seekToTime: (time: number) => void;
  }
  
  const audioPlayerRef = useRef<MediaPlayerRef>(null);
  const videoPlayerRef = useRef<MediaPlayerRef>(null);

  // Get the first media item (for now we'll just handle single media)
  const mediaItem = post.media[0];

  const handleLike = async () => {
    if (isLikeProcessing) return;

    try {
      setIsLikeProcessing(true);
      
      // Optimistic update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

      // Make API call
      const result = await togglePostLike(post.id);

      if (result.error) {
        // Revert optimistic update if there's an error
        setIsLiked(!newIsLiked);
        setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
        toast({
          title: "Error",
          description: "Failed to update like status. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsLikeProcessing(false);
    }
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    toast({
      title: "Bientôt disponible",
      description: "La fonctionnalité de partage sera disponible prochainement",
    });
  };

  const fetchComments = useCallback(async () => {
    if (!mediaItem) return;

    try {
      const { comments: fetchedComments, error } = await getCommentsByMediaId(mediaItem.id);
      
      if (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les commentaires",
          variant: "destructive"
        });
        return;
      }

      // Ensure fetchedComments is not undefined before setting state
      setComments(fetchedComments || []);
      setCommentsCount(fetchedComments?.length || 0);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commentaires",
        variant: "destructive"
      });
    }
  }, [mediaItem]);

  // Fetch comments when component mounts
  useEffect(() => {
    if (mediaItem) {
      fetchComments();
    }
  }, [mediaItem, fetchComments]);

  // Check if the current user is following the post author
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !post.profile.id || user.id === post.profile.id) {
        setIsFollowChecked(true);
        return;
      }

      try {
        const result = await isFollowing(user.id, post.profile.id);
        setIsFollowed(result.isFollowing || false);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setIsFollowChecked(true);
      }
    };

    if (user && !isFollowChecked) {
      checkFollowStatus();
    }
  }, [user, post.profile.id, isFollowChecked]);

  // Function to handle following a user
  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Vous devez être connecté pour suivre un utilisateur",
        variant: "destructive"
      });
      return;
    }

    // Don't allow users to follow themselves
    if (user.id === post.profile.id) {
      return;
    }

    // Optimistic update
    setIsFollowed(true);

    try {
      await followUser(user.id, post.profile.id);
    } catch (error) {
      console.error('Error following user:', error);
      setIsFollowed(false);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du suivi de l'utilisateur",
        variant: "destructive"
      });
    }
  };

  // Function to seek to a specific time in the media player
  const seekToTime = (time: number) => {
    setCurrentPlaybackTime(time);
    
    if (mediaItem?.media_type === 'audio' && audioPlayerRef.current) {
      audioPlayerRef.current.seekToTime(time);
    } else if (mediaItem?.media_type === 'video' && videoPlayerRef.current) {
      videoPlayerRef.current.seekToTime(time);
    }
  };

  console.log('Post:', post);

  return (
    <article className="bg-white rounded-[18px] shadow-sm overflow-hidden mb-8">
      {/* Post header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.profile.id}`}>
            <Avatar
              src={post.profile?.avatar_url || null}
              stageName={post.profile?.stage_name}
              size={40}
              className="rounded-full hover:opacity-90 transition-opacity"
            />
          </Link>

          <div className="flex items-center gap-2">
            <Link href={`/profile/${post.profile.id}`} className="hover:opacity-80 transition-opacity">
              <div>
                <h3 className="font-medium text-[#2D2D2D] flex">
                  <span>{post.profile.stage_name}</span>
                  {/* Follow button - only show if not the current user and if follow status has been checked */}
            {user && user.id !== post.profile.id && isFollowChecked && (
              <button 
                onClick={handleFollow}
                disabled={isFollowed}
                className={`ml-2 flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-colors ${
                  isFollowed 
                    ? 'bg-gray-100 text-gray-500 cursor-default' 
                    : 'bg-[#FA4D4D] text-white hover:bg-[#E63F3F]'
                }`}
              >
                {isFollowed ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Suivi</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" />
                    <span>Suivre</span>
                  </>
                )}
              </button>
            )}
                </h3>
                <p className="text-sm text-gray-500">@{post.profile.id}</p>
              </div>
            </Link>
            
            
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Title and description */}
      {mediaItem && (
        <div className="px-4 pb-4">
          <h2 className="text-lg font-semibold text-[#2D2D2D]">{mediaItem?.title || 'Untitled'}</h2>
          {mediaItem.description && (
            <p className="mt-1 text-gray-600">{mediaItem.description}</p>
          )}
        </div>
      )}

      {/* Media player */}
      {mediaItem && (
        mediaItem.media_type === 'audio' ? (
          <AudioPlayer
            audioUrl={mediaItem.media_url}
            mediaId={mediaItem.id}
            postId={post.id}
            comments={comments}
            onCommentAdded={fetchComments}
            onTimeUpdate={(time) => setCurrentPlaybackTime(time)}
            ref={audioPlayerRef}
          />
        ) : (
          <VideoPlayer 
            videoUrl={mediaItem.media_url} 
            mediaId={mediaItem.id}
            postId={post.id}
            comments={comments}
            onCommentAdded={fetchComments}
            onTimeUpdate={(time) => setCurrentPlaybackTime(time)}
            ref={videoPlayerRef}
          />
        )
      )}

      {/* Title and description */}
      <div className="px-4 pb-4">
        {post.content && (
          <p className="text-gray-600">{post.content}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-4 pb-4">
        {/* Like button */}
        <button 
          className={`flex items-center gap-2 ${isLikeProcessing ? 'opacity-50 cursor-wait' : ''}`}
          onClick={handleLike}
          disabled={isLikeProcessing}
        >
          <Heart 
            className={cn(
              "w-6 h-6 transition-colors",
              isLiked ? "fill-red-500 stroke-red-500" : "stroke-gray-500 hover:stroke-gray-700"
            )}
          />
          <span className="text-gray-500">{likesCount}</span>
        </button>
        <button 
          className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-6 h-6" />
          <span>{commentsCount}</span>
        </button>
        <button 
          className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
          onClick={handleShare}
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <CommentSection 
          mediaId={mediaItem.id}
          postId={post.id}
          comments={comments}
          currentPlaybackTime={currentPlaybackTime}
          onCommentAdded={fetchComments}
          onSeekToTime={seekToTime}
        />
      )}
    </article>
  );
}
