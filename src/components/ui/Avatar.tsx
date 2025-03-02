import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  stageName?: string | null;
  fallback?: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, stageName, fallback, size = 40, className }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`${stageName || 'User'}`}
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }

  // If no image, show fallback or first letter of stage name on black background
  const initial = fallback || (stageName ? stageName.charAt(0).toUpperCase() : '?');

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-black text-white',
        className
      )}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: `${size * 0.5}px` }}>{initial}</span>
    </div>
  );
}
