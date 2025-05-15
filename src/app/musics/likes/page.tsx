import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AuthGuard } from '@/components/auth/AuthGuard';
import { getLikedMedia } from './actions/likes';
import { LikedList } from './components';

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}

async function MediaList() {
  const result = await getLikedMedia(12, 1);

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
        Aucune musique aimée
      </div>
    );
  }

  return (
    <LikedList 
      initialMedia={result.media}
      initialTotal={result.total}
      initialHasMore={result.hasMore}
    />
  );
}

export default function LikedPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 px-8 py-6">
            <h1 className="text-2xl font-bold mb-8">Musiques aimées</h1>
            <Suspense fallback={<LoadingSpinner />}>
              <MediaList />
            </Suspense>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
