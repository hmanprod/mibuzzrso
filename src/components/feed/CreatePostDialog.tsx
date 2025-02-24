'use client';

import { useState, useCallback, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Music, Video } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { MediaType } from '@/types/database';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileUploadState {
  file: File;
  progress: number;
  status: 'waiting' | 'uploading' | 'done' | 'error';
}

export default function CreatePostDialog({ isOpen, onClose }: CreatePostDialogProps) {
  const [activeTab, setActiveTab] = useState<MediaType>('audio');
  const [dragActive, setDragActive] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileUploadState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { uploadToCloudinary, isUploading, progress, cancelUpload } = useCloudinaryUpload();

  if (!isOpen) return null;

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
  }, []);

  const handleFileSelect = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      if (activeTab === 'audio') {
        return file.type.startsWith('audio/');
      } else {
        return file.type.startsWith('video/');
      }
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: `Please select only ${activeTab} files`,
        variant: "destructive"
      });
    }

    const newFiles = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'waiting' as const,
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, [activeTab]);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a post",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);

      // 1. Upload all media files to Cloudinary
      const mediaUploads = await Promise.all(
        selectedFiles.map(async ({ file }, index) => {
          try {
            // Update file status to uploading
            setSelectedFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, status: 'uploading' as const } : f
            ));

            const result = await uploadToCloudinary(file, activeTab);
            
            // Update file status to done
            setSelectedFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, status: 'done' as const, progress: 100 } : f
            ));

            // 2. Create media records in Supabase
            const { data: mediaData, error: mediaError } = await supabase
              .from('medias')
              .insert({
                media_type: activeTab,
                media_url: result.url,
                media_public_id: result.publicId,
                duration: result.duration,
                title: file.name,
                user_id: user.id
              })
              .select()
              .single();

            if (mediaError) {
              toast({
                title: "Error",
                description: "Failed to create media record",
                variant: "destructive"
              });
              throw mediaError;
            }

            return { mediaId: mediaData.id, position: index };
          } catch (error) {
            // Update file status to error
            setSelectedFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, status: 'error' as const } : f
            ));
            throw error;
          }
        })
      );

      // 3. Create the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          content: postText,
          user_id: user.id
        })
        .select()
        .single();

      if (postError) throw postError;

      // 4. Create post_media relationships
      if (mediaUploads.length > 0) {
        const { error: relationError } = await supabase
          .from('posts_medias')
          .insert(
            mediaUploads.map(({ mediaId, position }) => ({
              post_id: postData.id,
              media_id: mediaId,
              position
            }))
          );

        if (relationError) throw relationError;
      }

      toast({
        title: "Success",
        description: "Your post has been created",
      });

      // Reset form
      setPostText('');
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = useCallback((index: number) => {
    if (selectedFiles[index].status === 'uploading') {
      cancelUpload();
    }
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, [selectedFiles, cancelUpload]);

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[18px] w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-[#2D2D2D]">Créer un post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Post Content */}
        <div className="p-4">
          <textarea
            className="w-full min-h-[120px] resize-none text-[15px] placeholder-gray-500 focus:outline-none"
            placeholder="Que souhaitez-vous partager ?"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex flex-col gap-3">
              {selectedFiles.map((fileState, index) => (
                <div key={index} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-[200px]">{fileState.file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-gray-700"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Progress bar */}
                  {fileState.status === 'uploading' && (
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  {/* Status indicator */}
                  <div className="text-xs">
                    {fileState.status === 'waiting' && 'En attente...'}
                    {fileState.status === 'uploading' && `Envoi en cours ${progress}%`}
                    {fileState.status === 'done' && 'Envoi terminé'}
                    {fileState.status === 'error' && 'Erreur lors de l\'envoi'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'audio'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('audio')}
          >
            Audio
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'video'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('video')}
          >
            Vidéo
          </button>
        </div>

        {/* Upload Zone */}
        <div 
          className={`p-4 ${dragActive ? 'bg-gray-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="border-2 border-dashed border-gray-200 rounded-[18px] p-4">
            <div className="text-center">
              {activeTab === 'audio' ? (
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                  <Music className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
              )}
              <h3 className="text-base font-medium text-[#2D2D2D] mb-2">
                Glissez-déposez votre fichier ici
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={activeTab === 'audio' ? "audio/*" : "video/*"}
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileSelect(Array.from(e.target.files));
                  }
                }}
              />
              <button 
                onClick={handleFileButtonClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-[18px] text-sm font-medium transition-colors"
              >
                Sélectionner un fichier
              </button>
              <p className="mt-2 text-xs text-gray-500">
                {activeTab === 'audio' 
                  ? 'Formats acceptés : MP3, WAV, AAC (max 100MB)'
                  : 'Formats acceptés : MP4, MOV (max 500MB)'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-100 flex justify-end space-x-3">
          <button 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-[18px] transition-colors"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-[18px] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading || (!postText.trim() && selectedFiles.length === 0)}
          >
            {isSubmitting ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  );
}
