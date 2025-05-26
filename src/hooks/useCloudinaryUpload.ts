import { useState, useRef, useCallback } from 'react';
import { MediaType } from '@/types/database';
import { cloudName, getUploadPreset } from '@/config/cloudinary';

interface UploadResult {
  url: string;
  publicId: string;
  duration?: number;
  cancelled?: boolean;
}

export class UploadCancelled extends Error {
  constructor() {
    super('Upload cancelled');
    this.name = 'UploadCancelled';
  }
}

export function useCloudinaryUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const currentUploadRef = useRef<XMLHttpRequest | null>(null);

  const uploadToCloudinary = async (
    file: File,
    mediaType: MediaType | 'avatar',
    signal?: AbortSignal
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      console.log('Starting Cloudinary upload:', {
        fileName: file.name,
        fileType: file.type,
        mediaType,
        size: file.size,
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', getUploadPreset());
      formData.append('cloud_name', cloudName);

      const resourceType = mediaType === 'avatar' ? 'image' : 'video';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const xhr = new XMLHttpRequest();
      currentUploadRef.current = xhr;

      // Track upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          setProgress(percentage);
        }
      };

      // Return a promise that resolves with the upload result
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        // Handle abort signal
        if (signal) {
          signal.addEventListener('abort', () => {
            if (currentUploadRef.current) {
              currentUploadRef.current.abort();
              currentUploadRef.current = null;
              setIsUploading(false);
              setProgress(0);
            }
            resolve({ cancelled: true, url: '', publicId: '' });
          });
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);

            // Vérifier si la durée est disponible
            if (!response.duration && (mediaType === 'audio' || mediaType === 'video')) {
              // Faire une requête séparée pour obtenir les détails du média
              fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/details/${response.public_id}`, {
                headers: {
                  'Authorization': `Basic ${btoa(`${cloudName}:${getUploadPreset()}`)}`,
                },
              })
                .then((res) => res.json())
                .then((details) => {
                  resolve({
                    url: response.secure_url,
                    publicId: response.public_id,
                    duration: details.duration || response.duration,
                  });
                })
                .catch(() => {
                  // En cas d'échec, on renvoie quand même le résultat initial
                  resolve({
                    url: response.secure_url,
                    publicId: response.public_id,
                    duration: response.duration,
                  });
                });
            } else {
              resolve({
                url: response.secure_url,
                publicId: response.public_id,
                duration: response.duration,
              });
            }
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

  const cancelUpload = useCallback(() => {
    if (currentUploadRef.current) {
      currentUploadRef.current.abort();
      currentUploadRef.current = null;
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  return { uploadToCloudinary, isUploading, progress, cancelUpload };
}
