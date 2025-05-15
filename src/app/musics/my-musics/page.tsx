import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AuthGuard } from '@/components/auth/AuthGuard';
import { getMediaLibrary } from './actions/library';
import LibraryMediaCard from '@/components/library/LibraryMediaCard';
import PageContainer from '@/components/layouts/PageContainer';
import MainContent from '@/components/layouts/MainContent';

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}

async function MediaList() {
  const result = await getMediaLibrary();

  if (result.error) {
    return (
      <div className="text-center py-8 text-red-500">
        {result.error}
      </div>
    );
  }

  if (!result.media?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Vous n&apos;avez pas encore uploadé de musique
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {result.media.map((item) => (
        <LibraryMediaCard key={item.id} media={item} />
      ))}
    </div>
  );
}

export default function MyMusicsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        <Navbar />
        <PageContainer>
          <Sidebar />
          <MainContent>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Ma bibliothèque</h1>
              <Link 
                href="/upload"
                className="flex items-center gap-2 px-4 py-2 bg-[#E94135] text-white rounded-lg hover:bg-[#E94135]/90 transition-colors"
              >
                Ajouter une musique
              </Link>
            </div>
            <Suspense fallback={<LoadingSpinner />}>
              <MediaList />
            </Suspense>
          </MainContent>
        </PageContainer>
      </div>
    </AuthGuard>
  );
}
