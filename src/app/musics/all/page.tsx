'use client';

import { useState, useEffect, useCallback } from 'react';
// import { Loader2 } from 'lucide-react';
import LibraryMediaCard from '@/components/library/LibraryMediaCard';
import { getMediaLibrary, getMoreMedia } from '../my-musics/actions/library';
import { SearchAndFilters } from './components';
import { Media } from '@/types/database';

// function LoadingSpinner() {
//   return (
//     <div className="flex justify-center items-center py-4">
//       <Loader2 className="w-6 h-6 animate-spin" />
//     </div>
//   );
// }

export default function AllMedia() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMedia = useCallback(async (isInitial: boolean = true) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const result = isInitial ? await getMediaLibrary(12) : await getMoreMedia(page);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const newMedia = result.media || [];

      if (isInitial) {
        setMedia(newMedia);
      } else {
        setMedia(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMedia = newMedia.filter(item => !existingIds.has(item.id));
          return [...prev, ...uniqueNewMedia];
        });
      }

      setHasMore(newMedia.length === 12);
      if (!isInitial && newMedia.length === 12) {
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error loading media:', err);
      setError('Failed to load media. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleScroll = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 800;

    if (scrollPosition > threshold) {
      loadMedia(false);
    }
  }, [loading, loadingMore, hasMore, loadMedia]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Tous les médias</h2>
        <SearchAndFilters />
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading && !media.length ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-md mb-4" />
        ))
      ) : (
        <div className="flex flex-col space-y-4">
          {media.map((item) => (
            <LibraryMediaCard key={item.id} media={item} />
          ))}
          
          {loadingMore && (
            <div className="animate-pulse bg-gray-200 h-32 rounded-md" />
          )}

          {!hasMore && media.length > 0 && (
            <div className="text-center text-gray-500 mt-8">
              No more media to load
            </div>
          )}
        </div>
      )}
    </div>
  );
}
