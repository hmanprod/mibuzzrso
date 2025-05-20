'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Simple redirect to feed page
    const timer = setTimeout(() => {
      router.push('/feed');
    }, 300);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-700 font-medium mb-2">Loading...</p>
        <p className="text-sm text-gray-500">Please wait while we prepare your experience</p>
      </div>
    </div>
  );
}
