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
        title: "Error",
        description: "You must be logged in to delete a post",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDeleting(true);
      
      const result = await deletePost(postId, user.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete post');
      }
      
      toast({
        title: "Success",
        description: "Post deleted successfully"
      });
      
      onClose();
      onDeleted?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete post. Please try again.",
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
          <DialogTitle>Delete Post</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
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
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
