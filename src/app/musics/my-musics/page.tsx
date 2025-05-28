import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getUserMediaLibrary } from './actions/library';
import { Media } from '@/types/database';
import LibraryMediaCard from '@/components/library/LibraryMediaCard';


function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}

async function MediaList() {
  const result = await getUserMediaLibrary();

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

  const audioMedia = result.media.filter(item => item.media_type === 'audio');

  if (!audioMedia.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Vous n&apos;avez pas encore uploadé de musique
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {audioMedia.map((item: Media) => (
        <LibraryMediaCard key={item.id} media={item} />
      ))}
    </div>
  );
}

export default function MyMusicsPage() {
  return (
    <div>

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
    </div>
  );
}
