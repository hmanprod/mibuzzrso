'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSearch } from '@/components/providers/SearchProvider';
import FeedPost from '@/components/feed/FeedPost';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

export default function SearchPage() {
  const { searchResults, isLoading, error, performSearch } = useSearch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q');

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query, performSearch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingAnimation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Erreur</h2>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => router.push('/feed')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
        >
          Retour au fil d&apos;actualité
        </button>
      </div>
    );
  }

  // console.log("search result", searchResults);
  

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Résultats pour "${query}"` : 'Recherche'}
      </h1>
      
      {searchResults.length === 0 ? (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h2>
          <p className="text-gray-600 mb-4">
            Nous n&apos;avons trouvé aucun contenu correspondant à votre recherche.
          </p>
          <button 
            onClick={() => router.push('/feed')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
          >
            Retour au fil d&apos;actualité
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {searchResults.map((post) => (
            <FeedPost key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
