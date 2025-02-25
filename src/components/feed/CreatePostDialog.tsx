'use client';

import { useState, useCallback, useRef } from 'react';
import { X, Music, Video } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { MediaType } from '@/types/database';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

interface FileUploadState {
  file: File;
  progress: number;
  status: 'waiting' | 'uploading' | 'done' | 'error';
  title: string;
}

export default function CreatePostDialog({ isOpen, onClose, onPostCreated }: CreatePostDialogProps) {
  const [activeTab, setActiveTab] = useState<MediaType>('audios');
  const [dragActive, setDragActive] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileUploadState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { uploadToCloudinary } = useCloudinaryUpload();

  const handleFileSelect = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      if (activeTab === 'audio') {
        return file.type.startsWith('audio/');
      } else {
        return file.type.startsWith('video/');
      }
    });

    if (validFiles.length === 0) {
      toast({
        title: "Format non supporté",
        description: `Veuillez sélectionner un fichier ${activeTab === 'audio' ? 'audio' : 'vidéo'} valide.`,
        variant: "destructive"
      });
      return;
    }

    const newFiles = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'waiting' as const,
      title: '',
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, [activeTab]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Validate that all files have titles
      const emptyTitleFiles = selectedFiles.filter(file => !file.title.trim());
      if (emptyTitleFiles.length > 0) {
        toast({
          title: "Validation Error",
          description: "Veuillez donner un titre à tous les media.",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);

      // Upload media files to Cloudinary
      const mediaPromises = selectedFiles.map(async ({ file, title }, index) => {
        try {
          setSelectedFiles(prev =>
            prev.map((f, i) =>
              i === index ? { ...f, status: 'uploading' } : f
            )
          );

          const result = await uploadToCloudinary(file, activeTab);

          setSelectedFiles(prev =>
            prev.map((f, i) =>
              i === index ? { ...f, status: 'done', progress: 100 } : f
            )
          );

          return {
            ...result,
            title
          };
        } catch (error) {
          setSelectedFiles(prev =>
            prev.map((f, i) =>
              i === index ? { ...f, status: 'error', progress: 0 } : f
            )
          );
          throw error;
        }
      });

      const mediaResults = await Promise.all(mediaPromises);

      // Create post with media
      const { error: insertError } = await supabase
        .from('medias')
        .insert(
          mediaResults.map(({ url, publicId, duration, title }) => ({
            media_type: activeTab,
            media_url: url,
            media_public_id: publicId,
            duration: duration || null,
            title,
            user_id: user.id
          }))
        );

      if (insertError) throw insertError;

      toast({
        title: "Post créé avec succès",
        description: "Votre post a été publié.",
      });

      onPostCreated?.();
      onClose();
      setSelectedFiles([]);
      setPostText('');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du post.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedFiles, activeTab, uploadToCloudinary, onPostCreated, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Créer un post</DialogTitle>
        </DialogHeader>

        <textarea
          className="w-full min-h-[100px] resize-none text-[15px] placeholder-gray-500 focus:outline-none"
          placeholder="Que souhaitez-vous partager ?"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />

        <div className="flex gap-4 border-b pb-4">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === 'audio'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('audio')}
          >
            <Music className="w-4 h-4" />
            <span>Audio</span>
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === 'video'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('video')}
          >
            <Video className="w-4 h-4" />
            <span>Video</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleFileButtonClick}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={activeTab === 'audio' ? 'audio/*' : 'video/*'}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                handleFileSelect(files);
                e.target.value = '';
              }}
              multiple
            />
            <p className="text-sm text-gray-500">
              Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
            </p>
          </div>

          <div className="space-y-4 mt-4">
            {selectedFiles.map((fileState, index) => (
              <div key={index} className="relative p-4 bg-gray-100 rounded-lg">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-sm font-medium mb-2">{fileState.file.name}</p>
                <input
                  type="text"
                  placeholder="Titre *"
                  className="w-full mb-2 px-3 py-2 border rounded-md"
                  value={fileState.title}
                  required
                  onChange={(e) => {
                    setSelectedFiles(prev =>
                      prev.map((f, i) =>
                        i === index ? { ...f, title: e.target.value } : f
                      )
                    );
                  }}
                />
                {fileState.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Envoi en cours...</span>
                      <span>{fileState.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileState.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {fileState.status === 'done' && (
                  <div className="mt-2 text-xs text-green-600">
                    Envoi terminé
                  </div>
                )}
                {fileState.status === 'error' && (
                  <div className="mt-2 text-xs text-red-600">
                    Erreur lors de l&apos;envoi
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedFiles.length === 0}
          >
            {isSubmitting ? 'Publication...' : 'Publier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
