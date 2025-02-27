'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { toast } from '@/components/ui/use-toast';
import { useSession } from '@/components/providers/SessionProvider';
import { addComment } from '@/app/feed/actions';
import { formatTime } from '@/lib/utils';
import { format } from 'timeago.js';

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

interface CommentSectionProps {
  mediaId: string;
  comments: Comment[];
  currentPlaybackTime: number;
  onCommentAdded: () => Promise<void>;
  onSeekToTime: (time: number) => void;
}

export default function CommentSection({ 
  mediaId, 
  comments, 
  currentPlaybackTime,
  onCommentAdded,
  onSeekToTime
}: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { user, profile } = useSession();

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentification requise",
        description: "Veuillez vous connecter pour ajouter des commentaires",
        variant: "destructive"
      });
      return;
    }

    if (!commentText.trim() || !mediaId) {
      toast({
        title: "Commentaire vide",
        description: "Veuillez saisir un commentaire",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmittingComment(true);
      
      // Pass the current playback time to the addComment function
      const { error } = await addComment(mediaId, commentText.trim(), currentPlaybackTime);

      if (error) {
        toast({
          title: "Erreur",
          description: "Erreur lors de l'ajout du commentaire",
          variant: "destructive"
        });
        return;
      }

      // Clear the comment text
      setCommentText('');
      
      // Refresh comments
      await onCommentAdded();

      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été ajouté avec succès",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du commentaire",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="border-t border-gray-100 p-4">
      <form onSubmit={handleAddComment} className="flex items-center gap-2 mb-4">
        <Avatar 
          src={profile?.avatar_url || null} 
          stageName={profile?.stage_name || null}
          size={25}
        />
        <input 
          type="text" 
          value={commentText} 
          onChange={(e) => setCommentText(e.target.value)} 
          placeholder="Ajouter un commentaire" 
          className="w-full p-2 pl-10 text-sm text-gray-700 rounded-lg shadow-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <button 
          type="submit" 
          disabled={isSubmittingComment} 
          className={`text-blue-500 hover:text-blue-700 transition-colors ${isSubmittingComment ? 'opacity-50' : ''}`}
        >
          <Send className="w-6 h-6" />
        </button>
      </form>
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <div className="flex-shrink-0">
                <Avatar 
                  src={comment.author.avatar_url || null} 
                  stageName={comment.author.stage_name || null}
                  size={25}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.author.stage_name || comment.author.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    a commenté à <span className="text-gray-800 font-semibold cursor-pointer"
                    onClick={() => onSeekToTime(comment.timestamp)}>{formatTime(comment.timestamp)}</span> {format(comment.created_at, 'fr')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">Pas encore de commentaires. Soyez le premier à commenter !</p>
      )}
    </div>
  );
}
