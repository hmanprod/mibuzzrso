'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Music2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { createChallenge } from '@/app/feed/actions/challenges';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { useSession } from '../providers/SessionProvider';
import JurySelector from './JurySelector';

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
  const { profile } = useSession()
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'remix' | 'live_mix'>('remix');
  const [votingType, setVotingType] = useState<'public' | 'jury'>('public');
  const [endAt, setEndAt] = useState('');
  const [winningPrize, setWinningPrize] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJury, setSelectedJury] = useState<Array<{ id: string; stage_name?: string; avatar_url?: string; email?: string }>>([]);
  const { uploadToCloudinary,  progress } = useCloudinaryUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedCover(null); // Reset cover when new file is selected
    }
  };

  const handleCoverSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner une image",
          variant: "destructive"
        });
        return;
      }
      setSelectedCover(file);
    }
  };

  const handleSubmit = async () => {
    if (!profile) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer un challenge",
        variant: "destructive"
      });
      return;
    }

    if (!title || !description || !endAt || !type) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (votingType === 'jury' && selectedJury.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un juré",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadResult;
      let coverUploadResult;

      if (selectedFile) {
        // Upload media file
        const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'audio';
        uploadResult = await uploadToCloudinary(selectedFile, mediaType);
        if (!uploadResult) throw new Error('Failed to upload media');

        // Upload or generate cover image
        if (selectedCover) {
          // If cover image is provided, upload it directly
          coverUploadResult = await uploadToCloudinary(selectedCover, 'cover');
          if (!coverUploadResult) throw new Error('Failed to upload cover image');
        } else {

          // Pour générer la cover, on doit d'abord créer un nouveau File à partir de l'URL
          const response = await fetch(uploadResult.url);
          const blob = await response.blob();
          const coverFile = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
          
          coverUploadResult = await uploadToCloudinary(coverFile, 'cover');
          if (!coverUploadResult) throw new Error('Failed to generate cover image');
        }
      }

      // Vérification que les uploads se sont bien passés
      if (!uploadResult || !coverUploadResult) {
        throw new Error('Upload results are missing');
      }

      await createChallenge({
        title,
        description,
        type,
        voting_type: votingType,
        endAt,
        winningPrize,
        userId: profile?.id || '',
        juryMembers: votingType === 'jury' ? selectedJury : [],
        medias: selectedFile ? [{
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          type: selectedFile.type.startsWith('video/') ? 'video' : 'audio',
          duration: uploadResult.duration,
          cover_url: coverUploadResult.url
        }] : []
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
      setSelectedJury([]);
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
                <label className="block text-sm text-gray-500 mb-1">Type de vote</label>
                <select
                  value={votingType}
                  onChange={(e) => setVotingType(e.target.value as 'public' | 'jury')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="public">Vote public</option>
                  <option value="jury">Vote jury</option>
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

            {votingType === 'jury' && (
              <div className="space-y-2">
                <label className="block text-sm text-gray-500">Sélectionner les jurys (4 max)</label>
                <JurySelector
                  selectedJury={selectedJury}
                  onJuryChange={setSelectedJury}
                />
              </div>
            )}

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

          {/* Sélecteur de cover image */}
          {selectedFile && (
            <div className="space-y-2">
              <Label htmlFor="cover">Image de couverture (optionnel)</Label>
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500">
                {selectedCover 
                  ? `Image sélectionnée : ${selectedCover.name}` 
                  : 'Si non sélectionnée, une image sera générée automatiquement'}
              </p>
            </div>
          )}

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
