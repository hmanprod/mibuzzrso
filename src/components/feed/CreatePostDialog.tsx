'use client';

import { useState, useCallback } from 'react';
import { Music, Video, Trash2 } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { MediaType } from '@/types/database';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'creating' | null>(null);

  const { user } = useAuth();
  const { uploadToCloudinary, isUploading, progress } = useCloudinaryUpload();

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;
    setError(null);

    const isValidType = activeTab === 'audio' 
      ? file.type.startsWith('audio/') 
      : file.type.startsWith('video/');

    if (!isValidType) {
      setError(`Please select a valid ${activeTab} file`);
      return;
    }

    setSelectedFile(file);
  }, [activeTab]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile || !title.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const supabase = createClient();

    try {
      setIsSubmitting(true);
      setError(null);
      setCurrentStep('upload');

      // 1. Upload media to Cloudinary
      console.log('Starting upload to Cloudinary...');
      const result = await uploadToCloudinary(selectedFile, activeTab);
      console.log('Cloudinary upload result:', result);

      if (!result?.url) {
        throw new Error('Upload failed: No URL received from Cloudinary');
      }

      setCurrentStep('creating');

      // 2. Create the media entry
      console.log('Creating media entry with data:', {
        media_type: activeTab,
        media_url: result.url,
        media_public_id: result.publicId,
        duration: result.duration,
        title: title.trim(),
        description: postText.trim() || null,
        user_id: user.id
      });

      const { data: mediaData, error: mediaError } = await supabase
        .from('medias')
        .insert({
          media_type: activeTab,
          media_url: result.url,
          media_public_id: result.publicId,
          duration: result.duration || null,
          title: title.trim(),
          description: postText.trim() || null,
          user_id: user.id
        })
        .select('id, media_type, media_url')
        .single();

      if (mediaError) {
        console.error('Media creation error:', mediaError);
        console.error('Media error details:', {
          message: mediaError.message,
          details: mediaError.details,
          hint: mediaError.hint
        });
        throw new Error(`Failed to create media: ${mediaError.message}`);
      }

      if (!mediaData) {
        console.error('No media data returned after insert');
        throw new Error('Failed to create media: No data returned');
      }

      console.log('Media created successfully:', mediaData);

      // 3. Create the post
      console.log('Creating post entry...');
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          content: postText.trim() || null,
          user_id: user.id
        })
        .select('id')
        .single();

      if (postError) {
        console.error('Post creation error:', postError);
        throw postError;
      }

      // 4. Link post and media
      console.log('Linking post and media...');
      const { error: linkError } = await supabase
        .from('posts_medias')
        .insert({
          post_id: postData.id,
          media_id: mediaData.id,
          position: 1 // First position since it's a single media
        });

      if (linkError) {
        console.error('Post-media linking error:', linkError);
        throw linkError;
      }

      console.log('Post created successfully');
      toast({
        title: "Post created successfully",
        description: "Your post has been published.",
      });

      onPostCreated?.();
      onClose();
      setSelectedFile(null);
      setTitle('');
      setPostText('');
      setError(null);
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error instanceof Error ? error.message : "An error occurred while creating the post.");
    } finally {
      setCurrentStep(null);
      setIsSubmitting(false);
    }
  }, [user, selectedFile, title, postText, activeTab, uploadToCloudinary, onPostCreated, onClose]);

  const handleTabChange = (newTab: MediaType) => {
    setActiveTab(newTab);
    setSelectedFile(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create a post</DialogTitle>
        </DialogHeader>

        {(isUploading || isSubmitting) ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {currentStep === 'upload' && "Uploading media..."}
                  {currentStep === 'creating' && "Creating post..."}
                </h3>
                <p className="text-sm text-gray-500">
                  {currentStep === 'upload' && "Please wait while we process your file"}
                  {currentStep === 'creating' && "Almost done! Finalizing your post..."}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>
                    {currentStep === 'upload' ? `${progress}%` : '100%'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ 
                      width: currentStep === 'upload' ? `${progress}%` : '100%'
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>
                  {currentStep === 'upload' && "Uploading..."}
                  {currentStep === 'creating' && "Creating your post..."}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              className="w-full min-h-[100px] resize-none text-[15px] placeholder-gray-500 focus:outline-none"
              placeholder="What would you like to share?"
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
                onClick={() => handleTabChange('audio')}
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
                onClick={() => handleTabChange('video')}
                type="button"
              >
                <Video className="h-5 w-5" />
                <span>Video</span>
              </button>
            </div>

            <div>
              {!selectedFile ? (
                <div className="mt-1 flex justify-center px-4 py-3 border border-gray-300 border-dashed rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="space-y-1 text-center">
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer font-medium text-indigo-600 hover:text-indigo-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                          accept={activeTab === 'audio' ? 'audio/*' : 'video/*'}
                          disabled={isSubmitting || isUploading}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      {activeTab === 'audio' ? 'Audio' : 'Video'} files only
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-200 rounded-md">
                        {activeTab === 'audio' ? (
                          <Music className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Video className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setTitle('');
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                      disabled={isSubmitting || isUploading}
                    >
                      <Trash2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      placeholder="Give your media a title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading || !selectedFile || !title.trim()}
              >
                {isSubmitting || isUploading ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
