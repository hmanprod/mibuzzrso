import Image from 'next/image';
import { twMerge } from 'tailwind-merge';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function AuthLayout({ children, className }: AuthLayoutProps) {
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
