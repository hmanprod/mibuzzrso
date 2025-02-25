import { useState } from 'react';
import { MediaType } from '@/types/database';
import { cloudName, getUploadPreset } from '@/config/cloudinary';

interface UploadResult {
  url: string;
  publicId: string;
  duration?: number;
}

export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadToCloudinary = async (
    file: File,
    mediaType: MediaType | 'avatar'
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      console.log('Starting Cloudinary upload:', {
        fileName: file.name,
        fileType: file.type,
        mediaType,
        size: file.size
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', getUploadPreset(mediaType));
      formData.append('cloud_name', cloudName);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${mediaType === 'avatar' ? 'image' : mediaType}/upload`;
      console.log('Uploading to:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('Cloudinary response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary error response:', errorText);
        throw new Error(errorText || 'Upload failed');
      }

      const data = await response.json();
      console.log('Cloudinary success response:', data);
      
      setProgress(100);
      return {
        url: data.secure_url,
        publicId: data.public_id,
        duration: data.duration,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToCloudinary,
    isUploading,
    progress,
  };
};
