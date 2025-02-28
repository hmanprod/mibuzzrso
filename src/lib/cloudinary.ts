import { cloudName } from '@/config/cloudinary';

export function getWaveformUrl(mediaUrl: string): string {
  // Extract the public ID from the media URL
  const matches = mediaUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!matches) return '';
  
  const fileNameParts = matches[1].split('.');
  const publicId = fileNameParts.slice(0, fileNameParts.length - 1).join('.');
  
  return `https://res.cloudinary.com/${cloudName}/video/upload/co_black,b_transparent,c_scale,fl_waveform/${publicId}.png`;
}
