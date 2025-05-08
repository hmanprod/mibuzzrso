'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { MediaCard } from '@/components/library/MediaCard';
import { getMediaLibrary } from './actions/library';
import { Media } from '@/types/database';
import { LibraryAudioPlayer } from '@/components/library/LibraryAudioPlayer';

export default function Library() {
  const [state, setState] = useState<{
    media: Media[];
    page: number;
    loading: boolean;
    hasMore: boolean;
  }>({
    media: [],
    page: 1,
    loading: false,
    hasMore: true
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);

  // const loadMore = async () => {
  //   try {
  //     setState(prev => ({ ...prev, loading: true }));
  //     const result = await getMoreMedia(state.page + 1);

  //     if (result.error) {
  //       setError(result.error);
  //       return;
  //     }

  //     setState(prev => ({
  //       ...prev,
  //       media: [...prev.media, ...result.media],
  //       page: prev.page + 1,
  //       hasMore: result.hasMore,
  //       loading: false
  //     }));
  //   } catch (err) {
  //     setError('Failed to load more media');
  //     setState(prev => ({ ...prev, loading: false }));
  //   }
  // };

  const fetchInitialMedia = useCallback(async () => {
    try {
      const result = await getMediaLibrary();

      if (result.error) {
        setError(result.error);
        return;
      }

      setState(prev => ({
        ...prev,
        media: result.media,
        hasMore: result.hasMore
      }));
    } catch (err) {
      console.log(err);
      
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialMedia();
  }, [fetchInitialMedia]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="flex justify-center items-center min-h-screen text-red-500">
          {error}
        </div>
      </AuthGuard>
    );
  }

  const handlePlay = (media: Media) => {
    setCurrentMedia(media);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          <div className="hidden lg:block w-[274px] fixed top-[60px] bottom-0 border-r border-border p-4">
            <Sidebar />
          </div>
          
          <div className="flex flex-1 ml-[274px]">
            <main className="flex-1 w-full mx-auto py-4 px-4 sm:px-0 max-w-7xl">
              <div className="container mx-auto py-8 px-4 space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">Bibliothèque</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {state.media.map((item) => (
                      <MediaCard 
                        key={item.id} 
                        media={item} 
                        onPlay={handlePlay}
                      />
                    ))}
                  </div>

                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      asChild
                    >
                      <Link href="/musics/all">
                        Voir tous les médias
                      </Link>
                    </Button>
                  </div>

                  {!state.hasMore && state.media.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Aucun média dans la bibliothèque
                    </div>
                  )}
                </section>
              </div>
            </main>
          </div>
        </div>

        {/* Player global */}
        <LibraryAudioPlayer 
          media={currentMedia} 
          onClose={() => setCurrentMedia(null)} 
        />
      </div>
    </AuthGuard>
  );
}
