import { useState, useRef, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { useSession } from '@/components/providers/SessionProvider';
import { Camera, Upload, X, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface CoverPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoverPhotoUploadModal({ isOpen, onClose }: CoverPhotoUploadModalProps) {
  const { profile, updateProfile } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadToCloudinary, isUploading, progress } = useCloudinaryUpload();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must not exceed 10MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !profile) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(selectedFile, 'avatar');
      
      // Update profile with new cover photo URL
      await updateProfile({
        cover_url: uploadResult.url
      });
      
      // Close modal and reset state
      onClose();
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      setError('An error occurred during upload. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Update Cover Photo</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Current or preview cover photo */}
          <div className="relative w-full">
            {previewUrl ? (
              <div className="relative w-full h-48 overflow-hidden rounded-md">
                <Image 
                  src={previewUrl} 
                  alt="Preview" 
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
                <button
                  onClick={removeSelectedFile}
                  className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full h-48 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                {profile?.cover_url ? (
                  <div className="relative w-full h-full">
                    <Image 
                      src={profile.cover_url} 
                      alt="Current cover" 
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 768px"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span>No cover photo</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* File input (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          {/* Upload button */}
          <Button 
            type="button" 
            variant="outline" 
            onClick={triggerFileInput}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Choose a photo
          </Button>
          
          <div className="text-sm text-gray-500">
            Recommended size: 1500 x 500 pixels
          </div>
          
          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          
          {/* Upload progress */}
          {isUploading && (
            <div className="w-full">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-center mt-1">Upload: {progress}%</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isSubmitting}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
