'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useSession } from '@/components/providers/SessionProvider';
import { toast } from '@/components/ui/use-toast';
import { Music2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { createPostWithMediaCP } from '@/app/feed/actions/post';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

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
  const { profile } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
  const { uploadToCloudinary, progress } = useCloudinaryUpload();

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
    console.log('Selected file:', selectedFile);
    console.log('Profile:', profile);

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

      // Upload du fichier
      const uploadResult = await uploadToCloudinary(selectedFile, selectedFile.type.startsWith('video/') ? 'video' : 'audio');
      if (!uploadResult) throw new Error("Échec de l'upload du média");

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
          author: null
        },
        challengeId
      );

      console.log();
      

      toast({
        title: "Succès",
        description: "Votre participation a été publiée"
      });

      onClose();
    } catch (error) {
      console.error('Error participating:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la participation",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-[18px] p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          Participer au challenge {challengeTitle}
        </DialogTitle>
        <div className="space-y-6 p-6 bg-white">
          <div className="flex items-center gap-3">
            <Avatar
              src={profile?.avatar_url || null}
              stageName={profile?.stage_name}
              size={40}
              className="rounded-full"
            />
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
            <input
              type="file"
              id="file-upload"
              accept={activeTab === 'audio' ? 'audio/*' : 'video/*'}
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
                  <p className="text-sm text-gray-500">ou glissez-déposez votre fichier {activeTab} ici</p>
                </div>
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
  );
}
