'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/components/providers/SearchProvider';
import FeedPost from '@/components/feed/FeedPost';
import { Loader2, ArrowLeft } from 'lucide-react';
import SearchBar from '@/components/ui/SearchBar';

export default function MobileSearchPage() {
  const { searchResults, isLoading, error, performSearch, searchTerm } = useSearch();
  const router = useRouter();
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    performSearch(term);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white z-10 p-4 flex items-center gap-3 border-b border-gray-100">
        <button 
          onClick={() => router.back()}
          className="text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <SearchBar 
          className="flex-1" 
          placeholder="Rechercher..." 
          autoFocus={true}
          onSearch={handleSearch}
        />
      </div>

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Erreur</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            {localSearchTerm ? (
              <>
                <h2 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h2>
                <p className="text-gray-600 text-center">
                  Nous n&apos;avons trouvé aucun contenu correspondant à &quot;{localSearchTerm}&quot;
                </p>
              </>
            ) : (
              <p className="text-gray-600 text-center">
                Recherchez des posts, des artistes ou des contenus
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">
              Résultats pour &quot;{localSearchTerm}&quot;
            </h2>
            {searchResults.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
