'use client';

import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: number;
  color?: string;
  spinnerOnly?: boolean;
}

export function Loading({
  message = "Chargement en cours...",
  size = 32,
  color = "#e94135", // blue-500
  spinnerOnly = false
}: LoadingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="relative">
          <Loader2 
            size={size} 
            color={color} 
            className="animate-spin" 
          />
          {!spinnerOnly && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1/3 h-1/3 rounded-full bg-white"></div>
            </div>
          )}
        </div>
        
        {message && (
          <p className="mt-4 text-gray-600 font-medium text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// Variant with pulsing dots
export function PulsingLoading({
  message = "Chargement en cours...",
  color = "#e94135",
}: Omit<LoadingProps, 'size' | 'spinnerOnly'>) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: color,
                animation: `pulse 1.5s infinite ease-in-out ${i * 0.2}s`
              }}
            ></div>
          ))}
        </div>
        
        {message && (
          <p className="mt-4 text-gray-600 font-medium text-center">
            {message}
          </p>
        )}

        <style jsx global>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            50% {
              transform: scale(1.2);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

// Skeleton loading variant
export function SkeletonLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header skeleton */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
