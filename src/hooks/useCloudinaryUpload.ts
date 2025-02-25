import { useState, useRef } from 'react';
import { MediaType } from '@/types/database';

interface UploadResult {
  url: string;
  publicId: string;
  duration?: number;
}

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
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
      setIsUploading(false);
      setProgress(0);
    }
  };

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

      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            resolve({
              url: data.secure_url,
              publicId: data.public_id,
              duration: data.duration,
            });
          } else {
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error'));
        };

        xhr.onabort = () => {
          reject(new Error('Upload cancelled'));
        };

        // First open the request
        xhr.open('POST', 
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${mediaType === 'avatar' ? 'image' : mediaType}/upload`
        );

        // Then set headers after opening
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        // Finally send the request
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    } finally {
      xhrRef.current = null;
      setIsUploading(false);
    }
  };

  return {
    uploadToCloudinary,
    isUploading,
    progress,
    cancelUpload,
  };
};
