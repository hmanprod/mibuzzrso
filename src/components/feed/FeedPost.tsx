'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Share2, Pencil, Trash2, UserPlus, Check } from 'lucide-react';
import type { ExtendedPost } from '@/types/database';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';
import CommentSection from './CommentSection';
import { Avatar } from '../ui/Avatar';
import { toast } from '@/components/ui/use-toast';
import { getCommentsByMediaId, togglePostLike } from '@/app/feed/actions/interaction';
import { followUser } from '@/app/profile/actions/follower';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import DeletePostDialog from './DeletePostDialog';
import EditPostDialog from './EditPostDialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { TimeAgo } from '../ui/TimeAgo';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Define proper types for the refs
  interface MediaPlayerRef {
    seekToTime: (time: number) => void;
  }
  
  const audioPlayerRef = useRef<MediaPlayerRef>(null);
  const videoPlayerRef = useRef<MediaPlayerRef>(null);

  // Get the first media item (for now we'll just handle single media)
  const mediaItem = post.medias[0];

  console.log('mediaItem',mediaItem);


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

  // Function to seek to a specific time in the media player
  const seekToTime = (time: number) => {
    setCurrentPlaybackTime(time);
    
    if (mediaItem?.media_type === 'audio' && audioPlayerRef.current) {
      audioPlayerRef.current.seekToTime(time);
    } else if (mediaItem?.media_type === 'video' && videoPlayerRef.current) {
      videoPlayerRef.current.seekToTime(time);
    }
  };

  // Check if the current user is the author of the post
  const isAuthor = user?.id === post.user_id;

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

    if (isFollowLoading) return;

    // Optimistic update
    setIsFollowLoading(true);
    
    // Create a shallow copy of the post object with updated is_followed value
    post.is_followed = true;

    try {
      // Call the API in the background
      const result = await followUser(user.id, post.user_id);

      if (result.error) {
        // If there's an error, revert the optimistic update
        console.error("Error following user:", result.error);
        post.is_followed = false;

        // Show error toast
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      // If there's an exception, revert the optimistic update
      console.error("Error following user:", error);
      post.is_followed = false;

      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Function to handle post deletion
  const handlePostDeleted = () => {
    toast({
      title: "Post deleted",
      description: "Your post has been deleted successfully."
    });
    // You might want to refresh the feed or remove this post from the UI
    // This depends on how your feed is implemented
  };

  // Function to handle post update
  const handlePostUpdated = () => {
    toast({
      title: "Post updated",
      description: "Your post has been updated successfully."
    });
    // You might want to refresh the feed to show the updated post
    // This depends on how your feed is implemented
  };

  return (
    <article className="bg-white rounded-[18px] shadow-sm overflow-hidden mb-4">
      {/* Post header */}
      <div className="flex justify-between w-full items-center p-4">
        <div className="flex items-center w-full space-x-3 text-sm">
          <div>
            <Link href={`/profile/${post.profile.id}`}>
              <Avatar
                src={post.profile.avatar_url}
                stageName={post.profile.stage_name?.[0] || 'U'}
                size={40}
              />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2">
            <div className="flex flex-1 items-center justify-between space-x-2">
              <Link href={`/profile/${post.profile.id}`}>
                <div className="flex flex-col items-start">
                  <h3 className="font-semibold text-[#2D2D2D]">
                    {post.profile.stage_name || 'Unknown Artist'}
                  </h3>
                  <TimeAgo date={post.created_at} defaultLanguage="fr" />
                </div>
              </Link>
              {!isAuthor && (
                <button
                  className={`flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-colors ${
                    post.is_followed
                      ? 'bg-gray-100 text-gray-500 cursor-default' 
                      : 'bg-gray-800 text-white hover:bg-[#E63F3F]'
                  }`}
                  onClick={() => !isFollowLoading && !post.is_followed && handleFollow()}
                  disabled={isFollowLoading || post.is_followed}
                >
                  { post.is_followed ? (
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
              </div>
            
          </div>
        </div>
        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Post
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Title and description */}
      {mediaItem && (
        <div className="px-4">
          <h2 className="text-base font-semibold text-[#2D2D2D]">{mediaItem?.title || 'Untitled'}</h2>
          {mediaItem.description && (
            <p className="mt-1 text-gray-600">{mediaItem.description}</p>
          )}
        </div>
      )}

      {/* Title and description */}
      {post.content && (
           <div className="px-4 pb-4">
          <p className="text-gray-600 text-sm">{post.content}</p>
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

      {/* Delete Post Dialog */}
      <DeletePostDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        postId={post.id}
        onDeleted={handlePostDeleted}
      />

      {/* Edit Post Dialog */}
      {mediaItem && (
        <EditPostDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          postId={post.id}
          mediaId={mediaItem.id}
          initialContent={post.content}
          initialTitle={mediaItem.title || ''}
          onUpdated={handlePostUpdated}
        />
      )}
    </article>
  );
}
