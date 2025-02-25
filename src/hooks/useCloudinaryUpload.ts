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
      formData.append('upload_preset', getUploadPreset());
      formData.append('cloud_name', cloudName);

      const resourceType = mediaType === 'avatar' ? 'image' : 'video';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          setProgress(percentage);
        }
      };

      // Return a promise that resolves with the upload result
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
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
        xhr.onerror = () => reject(new Error('Upload failed'));
      });

      // Send the request
      xhr.open('POST', uploadUrl, true);
      xhr.send(formData);

      const result = await uploadPromise;
      console.log('Cloudinary success response:', result);
      
      setProgress(100);
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
