import { useState } from 'react';
import { MediaType } from '@/types/database';

interface UploadResult {
  url: string;
  publicId: string;
  duration?: number;
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

const getUploadPreset = (mediaType: MediaType | 'avatar'): string => {
  switch (mediaType) {
    case 'audio':
      return process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AUDIO!;
    case 'video':
      return process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_VIDEO!;
    case 'avatar':
      return process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR!;
    default:
      throw new Error(`Invalid media type: ${mediaType}`);
  }
};

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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', getUploadPreset(mediaType));
      formData.append('cloud_name', cloudName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${mediaType === 'avatar' ? 'image' : mediaType}/upload`,
        {
          method: 'POST',
          body: formData,
          mode: 'cors',
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
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
