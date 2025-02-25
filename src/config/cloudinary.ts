export const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

export const getUploadPreset = (): string => {
  return 'mibuzzmedias';
};
