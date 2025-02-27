'use client';

import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import { useSession } from '@/components/providers/SessionProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function AuthLayout({ children, className }: AuthLayoutProps) {
  const { user } = useSession();
  const router = useRouter();

  useEffect(()=>{
    const getUser = ()=> {
      if(!user){
        router.push('/feed');
      }
    }

    getUser();
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className={twMerge("w-full max-w-[400px] bg-white rounded-[18px] p-10", className)}>
        {/* Logo */}
        <div className="flex justify-center mb-10">
        <Image src="/images/logo_black.svg" alt="BandLab Logo" width={150} height={45} priority={true}/>
        </div>
        {children}
      </div>
    </div>
  );
}
