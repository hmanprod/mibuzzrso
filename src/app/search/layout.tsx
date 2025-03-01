'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar className="fixed top-0 left-0 right-0 z-50" />
        
        <div className="flex pt-[72px]">
          <Sidebar className="fixed left-0 bottom-0 top-[72px] w-[274px]" />
          
          <div className="flex flex-1 ml-[274px]">
            {/* Feed central */}
            <main className="flex-1 max-w-[600px] mx-auto w-full py-4 px-4 sm:px-0">
            {children}
            </main>
            <div className='w-[350px]'></div>
            
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
