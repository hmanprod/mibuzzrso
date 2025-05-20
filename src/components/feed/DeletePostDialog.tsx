'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deletePost } from '@/app/feed/actions/post';
import { toast } from '@/components/ui/use-toast';

interface DeletePostDialogProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  onDeleted?: () => void;
}

export default function DeletePostDialog({ open, onClose, postId, onDeleted }: DeletePostDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useSession();

  const handleDelete = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour supprimer un post",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDeleting(true);
      
      const result = await deletePost(postId, user.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Échec de la suppression du post');
      }
      
      toast({
        title: "Succès",
        description: "Post supprimé avec succès"
      });
      
      onClose();
      onDeleted?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de la suppression du post. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supprimer le post</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce post ? Cette action ne peut pas être annulée.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Annuler
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
