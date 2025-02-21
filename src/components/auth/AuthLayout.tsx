import Image from 'next/image';
import { twMerge } from 'tailwind-merge';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className={twMerge("w-full max-w-[400px] bg-white rounded-[18px] p-8", className)}>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo.svg"
            alt="BandLab"
            width={120}
            height={30}
            priority
          />
        </div>
        {children}
      </div>
    </div>
  );
}
