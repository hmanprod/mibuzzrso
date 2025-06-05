'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearch } from '@/components/providers/SearchProvider';
import { searchMedias } from '../../../../actions/media/media';
import LibraryMediaCard from '@/components/library/LibraryMediaCard';
import { Media } from '@/types/database';

export default function SearchMediasPage() {
  const searchParams = useSearchParams();
  const { setSearchTerm } = useSearch();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const query = searchParams.get('q') || '';
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    setSearchTerm(query);
  }, [query, setSearchTerm]);

  const loadMedia = useCallback(async (isInitial: boolean = true) => {
    if (!query) return;

    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const result = await searchMedias(
        isInitial ? 1 : page,
        ITEMS_PER_PAGE,
        query
      );

      if (result.error) {
        throw new Error(result.error);
      }

      const newMedia = result.medias || [];

      if (isInitial) {
        setMedia(newMedia);
      } else {
        setMedia(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMedia = newMedia.filter(item => !existingIds.has(item.id));
          return [...prev, ...uniqueNewMedia];
        });
      }

      setHasMore(newMedia.length === ITEMS_PER_PAGE);
      if (!isInitial && newMedia.length === ITEMS_PER_PAGE) {
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error loading media:', err);
      setError('Failed to load media. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, query]);

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

  if (!query) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">Recherche</h1>
        <p className="text-gray-600">Veuillez entrer un terme de recherche</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">
        Résultats pour &quot;{query}&quot;
      </h1>

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
        <div className="flex flex-col space-y-10">
          {media.map((item: Media) => (
            <LibraryMediaCard key={item.id} media={item} />
          ))}
          
          {loadingMore && (
            <div className="animate-pulse bg-gray-200 h-32 rounded-md" />
          )}

          {!hasMore && media.length > 0 && (
            <div className="text-center text-gray-500 mt-8">
              Plus aucun média à charger
            </div>
          )}

          {!loading && media.length === 0 && (
            <p className="text-gray-600">Aucun résultat trouvé pour &quot;{query}&quot;</p>
          )}
        </div>
      )}
    </div>
  );
}
