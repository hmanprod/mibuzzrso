import { useState, useRef, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/Avatar';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { useSession } from '@/components/providers/SessionProvider';
import { Camera, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AvatarUploadModal({ isOpen, onClose }: AvatarUploadModalProps) {
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
      setError('Veuillez sélectionner une image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5 Mo');
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
      
      // Update profile with new avatar URL
      await updateProfile({
        avatar_url: uploadResult.url
      });
      
      // Close modal and reset state
      onClose();
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Une erreur est survenue lors du téléchargement. Veuillez réessayer.');
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier votre photo de profil</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Current or preview avatar */}
          <div className="relative">
            {previewUrl ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden">
                <Image 
                  src={previewUrl} 
                  alt="Aperçu" 
                  fill
                  className="object-cover"
                  sizes="128px"
                />
                <button
                  onClick={removeSelectedFile}
                  className="absolute top-0 right-0 bg-black/70 text-white p-1 rounded-full"
                  aria-label="Supprimer l'image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                <Avatar 
                  src={profile?.avatar_url || null} 
                  stageName={profile?.stage_name || null}
                  size={128}
                />
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
            Choisir une photo
          </Button>
          
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
              <p className="text-sm text-center mt-1">Téléchargement: {progress}%</p>
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
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isSubmitting}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            Mettre à jour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
