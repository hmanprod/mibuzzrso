import { MediaType } from '@/types/database';

export const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

export const getUploadPreset = (mediaType: MediaType | 'avatar'): string => {
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
