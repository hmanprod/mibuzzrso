'use client';

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';


export default function Setting() {
  const router = useRouter();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar className="fixed top-0 left-0 right-0 z-50" />
        
        <div className="flex pt-[72px]">
          <Sidebar className="fixed left-0 bottom-0 top-[72px] w-[274px]" />
          
          <div className="flex flex-1 ml-[274px]">
            <main className="flex-1 w-full mx-auto py-4 px-4 sm:px-0">
              <div className="max-w-2xl mx-auto mt-20">
                <div className="text-left space-y-8">
                  <div className="relative w-32 h-32">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-red-600 rounded-3xl transform rotate-6 animate-pulse opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-red-600 rounded-3xl transform -rotate-6 animate-pulse opacity-20 animation-delay-200"></div>
                    <div className="relative bg-gradient-to-br from-primary to-red-700 rounded-3xl w-full h-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <svg
                      className="w-16 h-16 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M19.4 15A1.65 1.65 0 0 0 21 13.6a1.65 1.65 0 0 0-.33-1.82l-1.45-1.45a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51v2.9a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l1.45-1.45A1.65 1.65 0 0 0 19.4 15zM4.6 9A1.65 1.65 0 0 0 3 10.4a1.65 1.65 0 0 0 .33 1.82l1.45 1.45a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51v-2.9a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33L3.33 8.18A1.65 1.65 0 0 0 4.6 9zM15 4.6A1.65 1.65 0 0 0 13.6 3a1.65 1.65 0 0 0-1.82.33L10.33 4.78a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1h2.9a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L15 4.6zM9 19.4A1.65 1.65 0 0 0 10.4 21a1.65 1.65 0 0 0 1.82-.33l1.45-1.45a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1h-2.9a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l1.45 1.45A1.65 1.65 0 0 0 9 19.4z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-red-600 tracking-wide">— Bientôt disponible</p>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                    Decouvrez de nouvelles fonctionnalites
                    </h1>
                    <p className="text-xl text-gray-600">
                    Restez connecté pour être au courant
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => router.back()}
                      className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm">Retour</span>
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
