'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Music2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { createChallenge } from '@/app/feed/actions/challenges';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

interface CreateChallengeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

export default function CreateChallengeDialog({
  open,
  onClose,
  onSubmit
}: CreateChallengeDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'remix' | 'live_mix'>('remix');
  const [endAt, setEndAt] = useState('');
  const [winningPrize, setWinningPrize] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadToCloudinary,  progress } = useCloudinaryUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !endAt || !selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Upload du fichier média
      const uploadResult = await uploadToCloudinary(selectedFile, selectedFile.type.startsWith('video/') ? 'video' : 'audio');
      if (!uploadResult) throw new Error("Échec de l'upload du média");

      // Création du challenge
      await createChallenge({
        title,
        description,
        type,
        endAt,
        winningPrize,
        userId: user?.id || '',
        medias: [{
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          mediaType: selectedFile.type.startsWith('video/') ? 'video' : 'audio',
          duration: uploadResult.duration
        }]
      });

      toast({
        title: "Succès",
        description: "Le challenge a été créé avec succès",
      });
      
      onSubmit?.();
      onClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du challenge",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setEndAt('');
      setWinningPrize('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogTitle className="sr-only">
          Créer un nouveau challenge
        </DialogTitle>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Avatar
              src={user?.user_metadata?.avatar_url || null}
              stageName={user?.user_metadata?.stage_name || user?.email?.[0]}
              size={40}
              className="rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold">Créer un challenge</h3>
              <p className="text-sm text-gray-500">Partagez votre créativité avec la communauté</p>
            </div>
          </div>

          {/* Formulaire */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Titre du challenge"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            
            <textarea
              placeholder="Description du challenge"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-500 mb-1">Type de challenge</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'remix' | 'live_mix')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="remix">Remix</option>
                  <option value="live_mix">Live Mix</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm text-gray-500 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Prix (optionnel)</label>
              <input
                type="text"
                placeholder="Prix pour le gagnant"
                value={winningPrize}
                onChange={(e) => setWinningPrize(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Zone de drop ou sélection de fichier */}
          <div 
            className={`
              border-2 border-dashed rounded-lg p-8
              ${selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
              transition-colors cursor-pointer text-center
            `}
            onClick={() => document.getElementById('challenge-file-upload')?.click()}
          >
            <input
              type="file"
              id="challenge-file-upload"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="space-y-3">
              <div className="flex justify-center">
                {selectedFile ? (
                  <Music2 className="h-12 w-12 text-green-500" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400" />
                )}
              </div>
              {selectedFile ? (
                <div>
                  <p className="text-green-600 font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-green-500">Fichier sélectionné</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">Cliquez pour sélectionner un fichier</p>
                  <p className="text-sm text-gray-500">ou glissez-déposez votre fichier audio/vidéo ici</p>
                </div>
              )}
            </div>
          </div>

          {/* Bouton de soumission */}
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className={`
              w-full py-3 px-4 rounded-lg font-semibold
              transition-colors
              ${selectedFile && !isSubmitting
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Création en cours...</span>
                </div>
                {progress > 0 && (
                  <div className="w-full bg-red-200 rounded-full h-2.5">
                    <div
                      className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              'Créer le challenge'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
