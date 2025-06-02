'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { useSession } from '@/components/providers/SessionProvider';
import { toast } from '@/components/ui/use-toast';
import { Upload, ImagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { createPostWithMediaCP } from '@/app/feed/actions/post';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import ConfirmCancelDialog from './ConfirmCancelDialog';

interface ParticipateModalProps {
  open: boolean;
  onClose: () => void;
  onParticipate: (file: File, setProgress: (progress: number) => void) => Promise<void>;
  challengeTitle: string;
  challengeId: string;
}

export default function ParticipateModal({
  open,
  onClose,
  challengeTitle,
  challengeId
}: ParticipateModalProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedCover(null);
    setContent('');
    setActiveTab('audio');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleClose = () => {
    if (isUploading) {
      setShowConfirmDialog(true);
      return;
    }
    
    // Vérifier si le formulaire a été modifié
    if (selectedFile || selectedCover || content.trim()) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmCancel = () => {
    resetForm();
    setShowConfirmDialog(false);
    onClose();
  };
  const { profile } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
  const { uploadToCloudinary, progress } = useCloudinaryUpload();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if ((activeTab === 'audio' && file.type.startsWith('audio/')) ||
          (activeTab === 'video' && file.type.startsWith('video/'))) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Type de fichier incorrect",
          description: `Veuillez sélectionner un fichier ${activeTab}`,
          variant: "destructive"
        });
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if ((activeTab === 'audio' && file.type.startsWith('audio/')) ||
          (activeTab === 'video' && file.type.startsWith('video/'))) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Type de fichier incorrect",
          description: `Veuillez sélectionner un fichier ${activeTab}`,
          variant: "destructive"
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier audio ou vidéo",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour participer",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      if (!selectedCover) {
        toast({
          title: "Image de couverture manquante",
          description: "Veuillez sélectionner une image de couverture",
          variant: "destructive"
        });
        return;
      }

      // Créer un nouveau AbortController pour cet upload
      abortControllerRef.current = new AbortController();

      let uploadResult, coverUpload;
      try {
        [uploadResult, coverUpload] = await Promise.all([
          uploadToCloudinary(selectedFile, selectedFile.type.startsWith('video/') ? 'video' : 'audio', abortControllerRef.current.signal),
          uploadToCloudinary(selectedCover, 'cover', abortControllerRef.current.signal)
        ]);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          // L'upload a été annulé, on sort silencieusement
          return;
        }
        throw error;
      }

      if (!uploadResult || !coverUpload) throw new Error("Échec de l'upload des fichiers");

      // Si l'upload a été annulé entre temps, on ne crée pas le post
      if (!abortControllerRef.current) return;

      // Création du post
      await createPostWithMediaCP(
        {
          title: challengeTitle,
          content: content || 'Participation au challenge',
          type: 'challenge_participation',
          userId: profile.id,
          mediaType: activeTab,
          mediaUrl: uploadResult.url,
          mediaPublicId: uploadResult.publicId,
          duration: uploadResult.duration || null,
          author: null,
          mediaCoverUrl: coverUpload.url
        },
        challengeId
      );

      // Ne montrer le toast de succès que si on n'a pas annulé entre temps
      if (abortControllerRef.current) {
        toast({
          title: "Succès",
          description: "Votre participation a été publiée"
        });
        onClose();
      }
    } catch (error) {
      console.error('Error participating:', error);
      // Ne montrer le toast d'erreur que si on n'a pas annulé
      if (abortControllerRef.current) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la participation",
          variant: "destructive"
        });
      }
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      // Réinitialiser l'AbortController
      abortControllerRef.current = null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] rounded-[18px] p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          Participer au challenge {challengeTitle}
        </DialogTitle>
        <div className="space-y-6 p-6 bg-white">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${profile?.pseudo_url || ''}`}>
              <Avatar
                src={profile?.avatar_url || null}
                stageName={profile?.stage_name?.[0] || 'U'}
                size={40}
                className="rounded-full"
              />
            </Link>
            <div>
              <h3 className="text-lg font-semibold">Participer au challenge</h3>
              <p className="text-sm text-gray-500">{challengeTitle}</p>
            </div>
          </div>

          {/* Choix du type de média */}
          <div className="flex gap-2 bg-gray-50 p-1 rounded-[18px]">
            {(['audio', 'video'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedFile(null);
                }}
                className={`
                  flex-1 px-4 py-2 rounded-md font-medium text-sm
                  transition-colors
                  ${activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab === 'audio' ? 'Audio' : 'Vidéo'}
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Décrivez votre participation..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-[18px] bg-gray-50 hover:bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none transition-colors"
            />
          </div>

          {/* Zone de drop ou sélection de fichier */}
          <div 
            className={`
              border-2 border-dashed rounded-[18px] p-8
              ${selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}
              transition-colors cursor-pointer text-center
            `}
            onClick={() => document.getElementById('file-upload')?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4">
                <div>
                  <input
                    type="file"
                    onChange={(e) => {
                      e.stopPropagation();
                      handleFileSelect(e);
                    }}
                    accept={activeTab === 'audio' ? 'audio/*' : 'video/*'}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    {selectedFile ? 'Changer de fichier' : `Sélectionner un ${activeTab}`}
                  </label>
                </div>
                
                <div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => {
                      e.stopPropagation();
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type.startsWith('image/')) {
                          setSelectedCover(file);
                        } else {
                          toast({
                            title: "Type de fichier incorrect",
                            description: "Veuillez sélectionner une image",
                            variant: "destructive"
                          });
                        }
                      }
                    }}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label
                    htmlFor="cover-upload"
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <ImagePlus className="w-5 h-5" />
                    {selectedCover ? 'Changer la couverture' : 'Ajouter une couverture'}
                  </label>
                </div>
              </div>
              
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Fichier sélectionné : {selectedFile.name}
                </p>
              )}
              {selectedCover && (
                <p className="text-sm text-gray-600">
                  Couverture sélectionnée : {selectedCover.name}
                </p>
              )}
            </div>
          </div>

          {/* Bouton de soumission */}
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className={`
              w-full py-3 px-4 rounded-[18px] font-semibold
              transition-colors
              ${selectedFile && !isUploading
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isUploading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Envoi en cours...</span>
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
              'Participer'
            )}
          </button>
        </div>
        </DialogContent>
      </Dialog>

      <ConfirmCancelDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmCancel}
        title="Annuler la participation ?"
        description={isUploading 
          ? "L'upload est en cours. Êtes-vous sûr de vouloir annuler ? L'upload sera interrompu et toutes les informations saisies seront perdues."
          : "Êtes-vous sûr de vouloir annuler votre participation ? Toutes les informations saisies seront perdues."}
        isUploading={isUploading}
      />
    </>
  );
}
