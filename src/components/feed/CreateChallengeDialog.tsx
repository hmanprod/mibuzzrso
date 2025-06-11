'use client';

import { useState, useCallback, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Upload, ImagePlus, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Button } from '@/components/ui/button';
import { createChallenge } from '@/actions/challenges/challenges';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { useSession } from '../providers/SessionProvider';
import JurySelector from './JurySelector';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  const { profile } = useSession();
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
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const { uploadToCloudinary, isUploading, progress, cancelUpload } = useCloudinaryUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;
    setError(null);

    const isValidType = file.type.startsWith('audio/') || file.type.startsWith('video/');
    if (!isValidType) {
      setError('Veuillez sélectionner un fichier audio ou vidéo valide');
      return;
    }

    // Vérifier la taille du fichier (limite de 100 Mo)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 Mo en octets
    if (file.size > MAX_FILE_SIZE) {
      setError('Le fichier est trop volumineux. La taille maximale autorisée est de 100 Mo.');
      return;
    }

    setSelectedFile(file);
    // Remove the file extension when setting the title
    const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
    setTitle(fileNameWithoutExtension);
    setSelectedCover(null); // Reset cover when new file is selected
  }, []);

  const handleCoverSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
      setError(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

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

    if (selectedFile && (!title.trim() || !selectedCover)) {
      toast({
        title: "Erreur",
        description: "Un titre et une image de couverture sont requis lorsque vous ajoutez un média",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadResult;
      let coverUploadResult;

      if (selectedFile && selectedCover) {
        // Upload media file
        const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'audio';
        uploadResult = await uploadToCloudinary(selectedFile, mediaType);
        if (!uploadResult) throw new Error('Échec du téléchargement du média');

        // Upload cover image
        coverUploadResult = await uploadToCloudinary(selectedCover, 'cover');
        if (!coverUploadResult) throw new Error('Échec du téléchargement de l\'image de couverture');

        // Vérifier que la durée est disponible
        if (!uploadResult.duration) {
          let attempts = 0;
          const maxAttempts = 10;
          while (!uploadResult.duration && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
          }
          
          if (!uploadResult.duration) {
            throw new Error('Impossible d\'obtenir la durée du média');
          }
        }
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
        medias: selectedFile && uploadResult && coverUploadResult ? [{
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
      handleClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du challenge",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (isSubmitting && isUploading) {
      setShowConfirmClose(true);
      return;
    }
    // Reset state
    setTitle('');
    setDescription('');
    setEndAt('');
    setWinningPrize('');
    setSelectedFile(null);
    setSelectedCover(null);
    setSelectedJury([]);
    setError(null);
    setIsSubmitting(false);
    onClose();
  }, [isSubmitting, isUploading, onClose]);

  const handleConfirmClose = useCallback(() => {
    setError('Téléchargement annulé');
    cancelUpload();
    setShowConfirmClose(false);
    handleClose();
  }, [cancelUpload, handleClose]);

  return (
    <>
      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Annuler le téléchargement ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Si vous fermez maintenant, le téléchargement sera annulé et le challenge ne sera pas créé.
              Êtes-vous sûr de vouloir annuler ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmClose(false)}>Continuer le téléchargement</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Oui, annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle className="sr-only">
            Créer un nouveau challenge
          </DialogTitle>
          {isSubmitting && isUploading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-red-100">
                  <div 
                    className="w-16 h-16 rounded-full border-4 border-red-500 border-t-transparent animate-spin absolute top-0 left-0"
                  />
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Upload className="w-6 h-6 text-red-500 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  Téléchargement de votre média...
                </p>
                <p className="text-sm text-gray-500">
                  {progress}% terminé
                </p>
                <div className="w-64 h-2 bg-red-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
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

              <div className="space-y-4">
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer
                      ${isDragging 
                        ? 'border-red-500 bg-red-50' 
                        : selectedFile 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,video/*"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="space-y-3 text-center">
                      <div className="flex justify-center">
                        <Upload className="h-12 w-12 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-600">Cliquez pour sélectionner un fichier</p>
                        <p className="text-sm text-gray-500">ou glissez-déposez votre fichier audio/vidéo ici</p>
                        <p className="text-xs text-gray-400">Taille maximale : 100 Mo</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 flex-1">
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Titre du média"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0 border-dashed"
                          onClick={() => coverInputRef.current?.click()}
                        >
                          <ImagePlus className="w-4 h-4" />
                        </Button>
                      </div>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverSelect}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Fichier : {selectedFile.name}
                    </p>
                    {selectedCover && (
                      <p className="text-sm text-gray-500">
                        Cover sélectionné : {selectedCover.name}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setSelectedCover(null);
                          setTitle('');
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                      </Button>
                    </div>
                    {isUploading && (
                      <div className="w-full bg-red-200 rounded-full h-2.5">
                        <div
                          className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                {selectedFile && (
                  <div className="space-y-2">
                    <Label htmlFor="cover">Image de couverture (requis)</Label>
                    <p className="text-sm text-gray-500">
                      Une image de couverture est requise lorsque vous ajoutez un média
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`
                  w-full py-3 px-4 rounded-lg font-semibold transition-colors
                  ${isSubmitting || (selectedFile && (!title.trim() || !selectedCover))
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                  }
                `}
              >
                {isSubmitting ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Création en cours...</span>
                    </div>
                  </div>
                ) : (
                  'Créer le challenge'
                )}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}