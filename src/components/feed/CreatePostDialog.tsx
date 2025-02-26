'use client';

import { useState, useCallback } from 'react';
import { Music, Video, Trash2 } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { MediaType } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function CreatePostDialog({ open, onClose, onSubmit }: CreatePostDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile || !title.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setCurrentStep('upload');

      // Upload media to Cloudinary
      const mediaUrl = await uploadToCloudinary(selectedFile, activeTab);
      if (!mediaUrl) {
        throw new Error('Failed to upload media');
      }

      setCurrentStep('creating');

      // Create FormData
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', postText);
      formData.append('mediaUrl', mediaUrl);
      formData.append('mediaType', activeTab);

      // Submit the post
      await onSubmit(formData);

      // Reset form
      setTitle('');
      setPostText('');
      setSelectedFile(null);
      setError(null);
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
      setCurrentStep(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media Type Selection */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'audio'
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Music className="w-5 h-5" />
              <span>Audio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'video'
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Video className="w-5 h-5" />
              <span>Video</span>
            </button>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter a title for your post"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              rows={3}
              placeholder="Add a description to your post"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload {activeTab === 'audio' ? 'Audio' : 'Video'}
            </label>
            <div className="relative">
              <input
                type="file"
                accept={activeTab === 'audio' ? 'audio/*' : 'video/*'}
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                className="hidden"
                id="media-upload"
              />
              <label
                htmlFor="media-upload"
                className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
              >
                {selectedFile ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFile(null);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedFile || !title.trim()}
            >
              {isSubmitting ? (
                <>
                  {currentStep === 'upload' ? 'Uploading...' : 'Creating Post...'}
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
