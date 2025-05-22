'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Flame, MessageCircle, Share2, MoreVertical, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/providers/SessionProvider';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deletePost } from '@/app/feed/actions/post';
import { togglePostLike } from '@/app/feed/actions/interaction';
import { getFeedbackComments } from '@/app/feedbacks/actions/comment';
import FeedbackCommentSection from './FeedbackCommentSection';
import { Feedback } from '@/types/feedback';
import { cn } from '@/lib/utils';

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

interface FeedbackCardProps {
  feedback: Feedback;
  onDelete?: () => void;
  onLikeToggle?: (isLiked: boolean) => void;
}

export default function FeedbackCard({ feedback, onDelete, onLikeToggle }: FeedbackCardProps) {
  const { user } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(feedback.is_liked || false);
  const [likesCount, setLikesCount] = useState(feedback.likes || 0);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(feedback.comments_count || 0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const handleLike = async () => {
    // Prevent rapid multiple clicks
    if (isLikeProcessing) return;
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Vous devez être connecté pour aimer un feedback",
        variant: "destructive"
      });
      return;
    }
    
    // Apply like immediately for better UX
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount((prev: number) => newIsLiked ? prev + 1 : prev - 1);
    
    // Si l'utilisateur aime le feedback, montrer automatiquement la section commentaires
    if (newIsLiked && !showComments) {
      setShowComments(true);
      // Précharger les commentaires si nécessaire
      if (comments.length === 0) {
        fetchComments();
      }
    }
    
    // Mark as processing in the background
    setIsLikeProcessing(true);
    
    try {
      // Make the API call in the background
      const result = await togglePostLike(feedback.id);
      
      // In case of error, cancel the optimistic update
      if (result.error) {
        setIsLiked(!newIsLiked);
        setLikesCount((prev: number) => newIsLiked ? prev - 1 : prev + 1);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut du like.",
          variant: "destructive"
        });
      } else {
        // Notify parent component if needed
        onLikeToggle?.(newIsLiked);
        
        if (newIsLiked) {
          // If like was successful and it's a new like, encourage the user to comment
          toast({
            title: "Vous aimez ce feedback !",
            description: "Partagez votre avis en laissant un commentaire.",
            variant: "default"
          });
        }
      }
    } catch (error) {
      // In case of error, cancel the optimistic update
      setIsLiked(!newIsLiked);
      setLikesCount((prev: number) => newIsLiked ? prev - 1 : prev + 1);
      console.error(error);
    } finally {
      setIsLikeProcessing(false);
    }
  };

  const fetchComments = useCallback(async () => {
    if (!showComments) return;
    
    setIsLoadingComments(true);
    try {
      // Use the dedicated feedback comments function
      const { comments: fetchedComments, error } = await getFeedbackComments(feedback.id);
      
      if (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les commentaires",
          variant: "destructive"
        });
        return;
      }
      
      setComments(fetchedComments || []);
      // Update the comments count based on the fetched data
      setCommentsCount(fetchedComments?.length || 0);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commentaires",
        variant: "destructive"
      });
    } finally {
      setIsLoadingComments(false);
    }
  }, [feedback.id, showComments]);
  
  // Fetch comments when showComments changes
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, fetchComments]);
  
  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleShare = () => {
    toast({
      title: "Bientôt disponible",
      description: "La fonctionnalité de partage sera disponible prochainement",
    });
  };

  const handleDelete = async () => {
    if (!user?.id || user.id !== feedback.user_id) return;

    try {
      setIsDeleting(true);
      const result = await deletePost(feedback.id, user.id);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Succès",
        description: "Le feedback a été supprimé",
      });

      onDelete?.();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le feedback",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="bg-white rounded-[18px] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${feedback.profile.stage_name || ''}`}>
            <Avatar
              src={feedback.profile.avatar_url}
              stageName={feedback.profile.stage_name[0]}
              size={40}
            />
          </Link>
          <div>
            <h3 className="font-semibold text-[#2D2D2D]">
              {feedback.profile.stage_name}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(feedback.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {user?.id === feedback.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-900"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span>Supprimer</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-[#2D2D2D] whitespace-pre-wrap mb-4">{feedback.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-6 mt-2">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors"
            disabled={isLikeProcessing}
          >
            <Flame
              className={cn(
                "w-5 h-5",
                isLiked ? "fill-orange-500 stroke-orange-500" : "stroke-gray-500 hover:stroke-gray-700"
              )}
            />
            <span className="text-sm">{likesCount}</span>
          </button>

          <button
            onClick={handleComment}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{commentsCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Comments section */}
      {showComments && (
        <div className="border-t border-gray-100 mt-2">
          {isLoadingComments ? (
            <div className="p-4 text-center">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          ) : (
            <FeedbackCommentSection
              feedbackId={feedback.id}
              comments={comments}
              onCommentAdded={fetchComments}
            />
          )}
        </div>
      )}
    </article>
  );
}
