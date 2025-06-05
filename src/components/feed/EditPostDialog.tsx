'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { updatePostContent, updateMediaTitle } from '@/actions/posts/post';
import { toast } from '@/components/ui/use-toast';

interface EditPostDialogProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  mediaId: string;
  initialContent: string | undefined;
  initialTitle: string;
  onUpdated?: () => void;
}

export default function EditPostDialog({ 
  open, 
  onClose, 
  postId, 
  mediaId,
  initialContent, 
  initialTitle,
  onUpdated 
}: EditPostDialogProps) {
  const [content, setContent] = useState(initialContent || '');
  const [title, setTitle] = useState(initialTitle || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Vous devez être connecté pour modifier un post');
      return;
    }

    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Update the post content
      const contentResult = await updatePostContent(postId, content, user.id);
      
      if (!contentResult.success) {
        throw new Error(contentResult.error || 'Échec de la mise à jour du contenu du post');
      }
      
      // Update the media title
      const titleResult = await updateMediaTitle(mediaId, title, user.id);
      
      if (!titleResult.success) {
        throw new Error(titleResult.error || 'Échec de la mise à jour du titre du média');
      }
      
      toast({
        title: "Succès",
        description: "Post mis à jour avec succès"
      });
      
      onClose();
      onUpdated?.();
    } catch (error) {
      console.error('Error updating post:', error);
      setError(error instanceof Error ? error.message : 'Échec de la mise à jour du post. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier le post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Title Field */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Titre
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entrez le titre"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          {/* Content Field */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Contenu (optionnel)
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Qu'avez-vous à partager ?"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour le post'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
