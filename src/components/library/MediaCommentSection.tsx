'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, MessageSquare, ThumbsUp } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { toast } from '@/components/ui/use-toast';
import { useSession } from '@/components/providers/SessionProvider';
import { addComment } from '@/actions/interactions/interaction_musics';
import { addPointsForComment } from '@/actions/pointss/actions';
import { formatTime } from '@/lib/utils';
import { formatTimeago, getUserLanguage } from '@/lib/timeago';

interface Comment {
  id: string;
  content: string;
  timestamp: number;
  created_at: string;
  parent_comment_id?: string | null;
  replies?: Comment[];
  author: {
    id: string;
    stage_name: string;
    avatar_url: string | null;
    username: string;
  };
}

interface MediaCommentSectionProps {
  mediaId: string;
  comments: Comment[];
  currentPlaybackTime: number;
  onCommentAdded: () => Promise<void>;
  onSeekToTime: (time: number) => void;
}

export default function MediaCommentSection({ 
  mediaId,
  comments,
  currentPlaybackTime,
  onCommentAdded,
  onSeekToTime
}: MediaCommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  // const [commentLikes, setCommentLikes] = useState<Record<string, { count: number, isLiked: boolean }>>({});
  const { user, profile } = useSession();

  // Organize comments into a hierarchical structure
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap: Record<string, Comment> = {};
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments by ID and initialize replies array
    flatComments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Second pass: organize into parent-child relationships
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap[comment.id];
      
      if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
        // This is a reply, add it to its parent's replies
        commentMap[comment.parent_comment_id].replies?.push(commentWithReplies);
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const organizedComments = organizeComments(comments);

  const handleAddComment = async (e: React.FormEvent) => {
    // console.log("submitting comment");
    
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add comments",
        variant: "destructive"
      });
      return;
    }

    const content = replyingTo ? commentText : commentText;
    
    if (!content.trim() || !mediaId) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmittingComment(true);
      
      // Pass the current playback time and parent comment ID if replying
      const { error, data } = await addComment(
        mediaId, 
        content.trim(), 
        replyingTo?.timestamp || currentPlaybackTime
      );

      if (error) {
        toast({
          title: "Error",
          description: "Error adding comment",
          variant: "destructive"
        });
        return;
      }

      // Ajouter les points pour le commentaire
      if (data?.id) {
        const { error: pointsError } = await addPointsForComment(data.id);
        if (pointsError) {
          console.error('Error adding points for comment:', pointsError);
        }
      }

      // Clear the comment text and reset replying state
      setCommentText('');
      setReplyingTo(null);
      
      // Refresh comments
      await onCommentAdded();

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Error adding comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };





  // Component to render a single comment with its replies
  const CommentItem = ({ comment, level = 0 }: { comment: Comment, level?: number }) => {
    // const likes = commentLikes[comment.id] || { count: 0, isLiked: false };
    
    return (
      <div className={`flex flex-col ${level === 1 ? 'ml-8 mt-3' : 'mt-3'}`}>
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0">
            <Link href={`/profile/${comment.author.username || ''}`}>
              <Avatar 
                src={comment.author.avatar_url || null} 
                stageName={comment.author.stage_name || null}
                size={25}
              />
            </Link>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {comment.author.stage_name || comment.author.username}
              </span>
              <span className="text-xs text-gray-500">
                commenté à <span 
                  className="text-gray-800 font-semibold cursor-pointer"
                  onClick={() => onSeekToTime(comment.timestamp)}
                >
                  {formatTime(comment.timestamp)}
                </span> {formatTimeago(comment.created_at, getUserLanguage())}
              </span>
            </div>
            <p className="text-sm text-gray-600">{comment.content}</p>
            <div className="flex items-center gap-4 mt-1">
              <button 
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setReplyingTo(comment);
                  // Focus on the input field
                  document.getElementById('comment-input')?.focus();
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Reply</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className={`${level === 0 ? 'border-l-2' : ''} border-gray-100`}>
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border-t border-gray-100 p-4">
      <form onSubmit={handleAddComment} className="flex flex-col gap-2">
        {replyingTo && (
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md mb-2">
            <span className="text-sm text-gray-600">
              Répondre à <span className="font-medium">{replyingTo.author.stage_name || replyingTo.author.username}</span>
            </span>
            <button 
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Annuler
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Link href={`/profile/${profile?.pseudo_url || ''}`}>
            <Avatar 
              src={profile?.avatar_url || null} 
              stageName={profile?.stage_name || null}
              size={25}
            />
          </Link>
          <input 
            id="comment-input"
            type="text" 
            value={commentText} 
            onChange={(e) => setCommentText(e.target.value)} 
            placeholder={replyingTo ? "Repondre à un commentaire..." : "ajouter un commentaire"} 
            className="w-full p-2 pl-4 text-sm text-gray-700 rounded-lg shadow-sm focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <button 
            type="submit" 
            disabled={isSubmittingComment} 
            className={`text-primary hover:text-primary transition-colors ${isSubmittingComment ? 'opacity-50' : ''}`}
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </form>

      {organizedComments.length > 0 ? (
        <div className="space-y-1 mt-4">
          {organizedComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-4">Soyez le premier à laisser un commentaire</p>
      )}
    </div>
  );
}
