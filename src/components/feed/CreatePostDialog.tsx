'use client';

import { useState, useCallback } from 'react';
import { Music, Video } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { MediaType } from '@/types/database';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

export default function CreatePostDialog({ isOpen, onClose, onPostCreated }: CreatePostDialogProps) {
  const [activeTab, setActiveTab] = useState<MediaType>('audio');
  const [postText, setPostText] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { user } = useAuth();
  const { uploadToCloudinary, isUploading, progress } = useCloudinaryUpload();

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;

    const isValidType = activeTab === 'audio' 
      ? file.type.startsWith('audio/') 
      : file.type.startsWith('video/');

    if (!isValidType) {
      toast({
        title: "Format non supporté",
        description: `Veuillez sélectionner un fichier ${activeTab === 'audio' ? 'audio' : 'vidéo'} valide.`,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  }, [activeTab]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile || !title.trim()) return;

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      console.log('Starting upload for file:', selectedFile.name, 'type:', selectedFile.type);
      const result = await uploadToCloudinary(selectedFile, activeTab);
      console.log('Upload result:', result);

      const { error: insertError } = await supabase
        .from('medias')
        .insert({
          media_type: activeTab,
          media_url: result.url,
          media_public_id: result.publicId,
          duration: result.duration || null,
          title: title.trim(),
          user_id: user.id
        });

      if (insertError) throw insertError;

      toast({
        title: "Post créé avec succès",
        description: "Votre post a été publié.",
      });

      onPostCreated?.();
      onClose();
      setSelectedFile(null);
      setTitle('');
      setPostText('');
      setUploadProgress(0);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création du post.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedFile, title, activeTab, uploadToCloudinary, onPostCreated, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Créer un post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <textarea
            className="w-full min-h-[100px] resize-none text-[15px] placeholder-gray-500 focus:outline-none border rounded-lg p-2"
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
              type="button"
            >
              <Music className="h-5 w-5" />
              <span>Audio</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                activeTab === 'video'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('video')}
              type="button"
            >
              <Video className="h-5 w-5" />
              <span>Video</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du media
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Donnez un titre à votre media"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choisir un fichier
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      accept={activeTab === 'audio' ? 'audio/*' : 'video/*'}
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  {activeTab === 'audio' ? 'Audio' : 'Video'} files only
                </p>
                {selectedFile && (
                  <p className="text-sm text-gray-500">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                      Uploading
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-indigo-600">
                      {progress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                  <div
                    style={{ width: `${progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedFile || !title.trim()}
            >
              Publier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
