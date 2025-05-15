'use client';

import { useState } from 'react';
import LibraryMediaCard from '@/components/library/LibraryMediaCard';
import { Media } from '@/types/database';
import { getSubscriptionsMedia } from './actions/subscriptions';

interface SubscriptionsListProps {
  initialMedia: Media[];
  initialTotal: number;
  initialHasMore: boolean;
}

export function SubscriptionsList({ initialMedia, initialHasMore }: SubscriptionsListProps) {
  const [media, setMedia] = useState(initialMedia);
  // const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadMore = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const result = await getSubscriptionsMedia(12, nextPage);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMedia([...media, ...result.media]);
      // setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError('Une erreur est survenue lors du chargement');
      console.log(err);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4">
        {media.map((item) => (
          <LibraryMediaCard key={item.id} media={item} />
        ))}
      </div>

      {error && (
        <div className="text-center text-red-500">
          {error}
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <button 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Charger plus'}
          </button>
        </div>
      )}
    </div>
  );
}
