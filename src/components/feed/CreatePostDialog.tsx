'use client';

import { useState, useCallback, useRef } from 'react';
import { Music, Video, Trash2, Upload, Loader2 } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { MediaType } from '@/types/database';
import { useSession } from '@/components/providers/SessionProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createPostWithMedia } from '@/app/feed/actions/post';

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  postType?: 'post' | 'feedback';
}

export default function CreatePostDialog({ open, onClose, onSubmit, postType = 'post' }: CreatePostDialogProps) {
  const [activeTab, setActiveTab] = useState<MediaType>('audio');
  const [postText, setPostText] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'creating' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useSession();
  const { uploadToCloudinary, isUploading, progress } = useCloudinaryUpload();

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;
    setError(null);

    const isValidType = activeTab === 'audio' 
      ? file.type.startsWith('audio/') 
      : file.type.startsWith('video/');

    if (!isValidType) {
      setError(`Veuillez sélectionner un fichier ${activeTab === 'audio' ? 'audio' : 'vidéo'} valide`);
      return;
    }

    setSelectedFile(file);
    // Remove the file extension when setting the title
    const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
    setTitle(fileNameWithoutExtension);
  }, [activeTab]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile || !title.trim()) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setIsSubmitting(true);
      setCurrentStep('upload');

      // Upload media to Cloudinary (keep this client-side)
      const mediaUpload = await uploadToCloudinary(selectedFile, activeTab);
      if (!mediaUpload) {
        throw new Error('Échec du téléchargement du média');
      }

      setCurrentStep('creating');

      // Use the server action to handle database operations
      const result = await createPostWithMedia({
        author: activeTab === 'audio' ? author.trim() : null,
        type: postType,
        mediaType: activeTab,
        mediaUrl: mediaUpload.url,
        mediaPublicId: mediaUpload.publicId,
        title: title.trim(),
        duration: mediaUpload.duration ? Number(mediaUpload.duration.toFixed(2)) : null,
        content: postText.trim() || null,
        userId: user.id
      });

      if (!result.success) {
        throw new Error(result.error || 'Échec de la création du post');
      }

      // Reset form
      setTitle('');
      setPostText('');
      setSelectedFile(null);
      setError(null);
      
      // Close dialog and notify parent
      onClose();
      onSubmit?.();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Échec de la création du post. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
      setCurrentStep(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau post</DialogTitle>
        </DialogHeader>

        {isSubmitting ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20">
                <div 
                  className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"
                />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {currentStep === 'upload' ? (
                  <Upload className="w-6 h-6 text-primary animate-pulse" />
                ) : (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                )}
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {currentStep === 'upload' ? 'Téléchargement de votre média...' : 'Création de votre post...'}
              </p>
              {currentStep === 'upload' && (
                <>
                  <p className="text-sm text-gray-500">
                    {progress}% terminé
                  </p>
                  <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Media Type Selection */}
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg hidden">
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  activeTab === 'audio' ? 'bg-primary text-white' : 'bg-white'
                }`}
              >
                <Music className="w-5 h-5" />
                <span>Audio</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  activeTab === 'video' ? 'bg-primary text-white' : 'bg-white'
                }`}
              >
                <Video className="w-5 h-5" />
                <span>Vidéo</span>
              </button>
            </div>

            {/* Media Upload and Preview */}
            <div className="space-y-4">
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
                    ${isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-primary/50'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    accept={activeTab === 'audio' ? 'audio/*' : 'video/*'}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <Upload className="w-8 h-8" />
                    <p className="text-sm font-medium">
                      Glissez-déposez votre fichier {activeTab === 'audio' ? 'audio' : 'vidéo'} ici, ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs">
                      Formats supportés : {activeTab === 'audio' ? 'MP3, WAV, AAC' : 'MP4, WebM, MOV'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-1">
                      {activeTab === 'audio' && (
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="Nom de l'artiste"
                          className="w-[150px] px-3 py-2 border rounded-md"
                        />
                      )}
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={`Titre ${activeTab === 'audio' ? 'audio' : 'vidéo'}`}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedFile.name}
                  </p>
                  <div className='flex justify-end'>
                  <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setTitle('');
                        setAuthor('');
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                    </Button>
                  </div>
                  {isUploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            {/* Content Field */}
            <div className="space-y-4">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Parle-nous de ce projet ..."
                className="w-full min-h-[100px] resize-none focus:outline-none text-lg"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || (!selectedFile || !title.trim())}
              >
                Créer le post
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
