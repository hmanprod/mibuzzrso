'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

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
      <div className="text-center p-8  max-w-md w-full">
        <Image
          src="/images/logo_black.svg"
          alt="MiBuzz Logo"
          width={200}
          height={80}
          className="animate-pulse mx-auto mb-4"
        />
        <p className="text-sm text-gray-500">Ndao hizara mozika</p>
      </div>
    </div>
  );
}
