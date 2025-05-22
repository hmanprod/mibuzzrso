'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, MessageSquare } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { toast } from '@/components/ui/use-toast';
import { useSession } from '@/components/providers/SessionProvider';
import { addFeedbackComment } from '@/app/feedbacks/actions/comment';
import { formatTimeago, getUserLanguage } from '@/lib/timeago';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    stage_name: string;
    avatar_url: string | null;
    username: string;
    pseudo_url: string;
  };
}

interface FeedbackCommentSectionProps {
  feedbackId: string;
  comments: Comment[];
  onCommentAdded: () => Promise<void>;
}

export default function FeedbackCommentSection({ 
  feedbackId,
  comments,
  onCommentAdded
}: FeedbackCommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { user, profile } = useSession();
  
  // Fonctionnalité de likes sur commentaires temporairement désactivée
  // const [commentLikes, setCommentLikes] = useState<Record<string, { count: number, isLiked: boolean }>>({});
  
  // // Load comment likes when comments change
  // useEffect(() => {
  //   const loadCommentLikes = async () => {
  //     const likesPromises = comments.map(async (comment) => {
  //       try {
  //         const result = await getFeedbackCommentLikes(comment.id);
  //         if (!result.error) {
  //           return { 
  //             commentId: comment.id, 
  //             data: { 
  //               count: result.count || 0, 
  //               isLiked: result.isLiked || false 
  //             } 
  //           };
  //         }
  //       } catch (error) {
  //         console.error(`Error loading likes for comment ${comment.id}:`, error);
  //       }
  //       return null;
  //     });
  //     
  //     const likesResults = await Promise.all(likesPromises);
  //     const newLikes: Record<string, { count: number, isLiked: boolean }> = {};
  //     
  //     likesResults.forEach(result => {
  //       if (result) {
  //         newLikes[result.commentId] = { 
  //           count: result.data.count, 
  //           isLiked: result.data.isLiked 
  //         };
  //       }
  //     });
  //     
  //     setCommentLikes(newLikes);
  //   };
  //   
  //   if (comments.length > 0) {
  //     loadCommentLikes();
  //   }
  // }, [comments]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Vous devez être connecté pour commenter",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmittingComment(true);
    
    try {
      // Use the dedicated feedback comment action
      const result = await addFeedbackComment(feedbackId, commentText.trim());
      
      if (result.error) {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive"
        });
        return;
      }
      
      // Clear the input and refresh comments
      setCommentText('');
      await onCommentAdded();
      
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès",
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'ajout du commentaire",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // const handleLikeComment = async (commentId: string) => {
  //   if (!user) {
  //     toast({
  //       title: "Authentication required",
  //       description: "Vous devez être connecté pour aimer un commentaire",
  //       variant: "destructive"
  //     });
  //     return;
  //   }
    
  //   // Optimistic update
  //   setCommentLikes(prev => {
  //     const current = prev[commentId] || { count: 0, isLiked: false };
  //     return {
  //       ...prev,
  //       [commentId]: {
  //         count: current.isLiked ? current.count - 1 : current.count + 1,
  //         isLiked: !current.isLiked
  //       }
  //     };
  //   });
    
  //   try {
  //     // Use the dedicated feedback comment like action
  //     const result = await likeFeedbackComment(commentId, feedbackId);
      
  //     if (result.error) {
  //       // Revert optimistic update on error
  //       setCommentLikes(prev => {
  //         const current = prev[commentId];
  //         if (!current) return prev;
          
  //         return {
  //           ...prev,
  //           [commentId]: {
  //             count: current.isLiked ? current.count - 1 : current.count + 1,
  //             isLiked: !current.isLiked
  //           }
  //         };
  //       });
        
  //       toast({
  //         title: "Erreur",
  //         description: result.error,
  //         variant: "destructive"
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error liking comment:', error);
      
  //     // Revert optimistic update on error
  //     setCommentLikes(prev => {
  //       const current = prev[commentId];
  //       if (!current) return prev;
        
  //       return {
  //         ...prev,
  //         [commentId]: {
  //           count: current.isLiked ? current.count - 1 : current.count + 1,
  //           isLiked: !current.isLiked
  //         }
  //       };
  //     });
  //   }
  // };

  return (
    <div className="border-t border-gray-100 pt-4">
      {/* Comment form */}
      <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 px-4 mb-4">
        <Avatar
          src={profile?.avatar_url || null}
          stageName={(profile?.stage_name || 'U')[0]}
          size={32}
        />
        <div className="flex-1 relative">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="w-full py-2 px-3 pr-10 bg-gray-50 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={isSubmittingComment}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary disabled:text-gray-300"
            disabled={!commentText.trim() || isSubmittingComment}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4 px-4 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucun commentaire pour le moment</p>
            <p className="text-sm">Soyez le premier à commenter</p>
          </div>
        ) : (
          comments.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Link href={`/profile/${comment.author.pseudo_url}`}>
                  <Avatar
                    src={comment.author.avatar_url}
                    stageName={(comment.author.stage_name || 'U')[0]}
                    size={32}
                  />
                </Link>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/profile/${comment.author.pseudo_url}`}>
                        <span className="font-medium text-sm">{comment.author.stage_name}</span>
                      </Link>
                      <span className="text-xs text-gray-500">
                        {formatTimeago(comment.created_at, getUserLanguage())}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  {/* Likes sur commentaires temporairement désactivés */}
                </div>
              </div>
          ))
        )}
      </div>
    </div>
  );
}
