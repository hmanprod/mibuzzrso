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
      // Create a new FormData instance
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', getUploadPreset(mediaType));
      formData.append('cloud_name', cloudName);

      // Use XMLHttpRequest for better upload progress tracking
      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        };

        // Handle successful upload
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url,
              publicId: response.public_id,
              duration: response.duration,
            });
          } else {
            reject(new Error('Upload failed'));
          }
        };

        // Handle network errors
        xhr.onerror = () => reject(new Error('Network error during upload'));

        // Open and send the request
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${mediaType === 'avatar' ? 'image' : mediaType}/upload`);
        xhr.send(formData);
      });

      return result;
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
