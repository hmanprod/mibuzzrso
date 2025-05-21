'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2 } from 'lucide-react';
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
import { Feedback } from '@/types/feedback';
import { cn } from '@/lib/utils';

interface FeedbackCardProps {
  feedback: Feedback;
  onDelete?: () => void;
}

export default function FeedbackCard({ feedback, onDelete }: FeedbackCardProps) {
  const { user } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLike = () => {
    toast({
      title: "Bientôt disponible",
      description: "La fonctionnalité de like sera disponible prochainement",
    });
  };

  const handleComment = () => {
    toast({
      title: "Bientôt disponible",
      description: "La fonctionnalité de commentaire sera disponible prochainement",
    });
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
          <Avatar
            src={feedback.profile.avatar_url}
            stageName={feedback.profile.stage_name[0]}
            size={40}
          />
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
          >
            <Heart
              className={cn(
                "w-5 h-5",
                "hover:fill-primary"
              )}
            />
            <span className="text-sm">0</span>
          </button>

          <button
            onClick={handleComment}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">0</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
