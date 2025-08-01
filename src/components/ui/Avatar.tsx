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
  const initial = fallback || (stageName ? stageName.charAt(0).toUpperCase() : 'U');

  return (
    <div
      className={cn(
        'relative inline-block overflow-hidden rounded-full',
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={`${stageName || 'User'}`}
          fill
          sizes={`${size}px`}
          className="object-cover"
          priority={false}
        />
      ) : (
        <div
          className="flex items-center justify-center bg-black text-white rounded-full"
          style={{ width: '100%', height: '100%' }}
        >
          <span style={{ fontSize: `${size * 0.5}px` }}>{initial}</span>
        </div>
      )}
    </div>
  );
}
