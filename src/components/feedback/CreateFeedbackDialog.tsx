'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createFeedbackPost } from '@/actions/feedback/feedback';

interface CreateFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

export default function CreateFeedbackDialog({ open, onClose, onSubmit }: CreateFeedbackDialogProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useSession();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !content.trim()) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await createFeedbackPost({
        description: content.trim(),
        userId: user.id
      });

      if (!result.success) {
        throw new Error(result.error || 'Échec de la création du feedback');
      }

      // Réinitialiser le formulaire
      setContent('');
      setError(null);
      
      // Fermer la boîte de dialogue et notifier le parent
      onClose();
      onSubmit?.();
    } catch (error) {
      console.error('Error creating feedback:', error);
      setError('Échec de la création du feedback. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Une idée pour faire bouger MiBuzz ?</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Dis-nous ce que tu as en tête (idées, suggestions, bugs, etc.)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ex : Ajoute un nouveau type de challenge, une fonctionnalité, ou une amélioration…"
                className="mt-1 h-32"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Partager'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
