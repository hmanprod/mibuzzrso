'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Music2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
// import { VisuallyHidden } from '../ui/VisuallyHidden';

interface ParticipateModalProps {
  open: boolean;
  onClose: () => void;
  onParticipate: (file: File, setProgress: (progress: number) => void) => Promise<void>;
  challengeTitle: string;
}

export default function ParticipateModal({
  open,
  onClose,
  onParticipate,
  challengeTitle
}: ParticipateModalProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
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

    try {
      setIsUploading(true);
      await onParticipate(selectedFile, setUploadProgress);
      onClose();
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogTitle className="sr-only">
          Participer au challenge {challengeTitle}
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
              <h3 className="text-lg font-semibold">Participer au challenge</h3>
              <p className="text-sm text-gray-500">{challengeTitle}</p>
            </div>
          </div>

          {/* Zone de drop ou sélection de fichier */}
          <div 
            className={`
              border-2 border-dashed rounded-lg p-8
              ${selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
              transition-colors cursor-pointer text-center
            `}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              type="file"
              id="file-upload"
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
            disabled={!selectedFile || isUploading}
            className={`
              w-full py-3 px-4 rounded-lg font-semibold
              transition-colors
              ${selectedFile && !isUploading
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isUploading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Envoi en cours...</span>
                </div>
                {uploadProgress > 0 && (
                  <div className="w-full bg-red-200 rounded-full h-2.5">
                    <div
                      className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
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
  );
}
