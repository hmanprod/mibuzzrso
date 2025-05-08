'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaCard } from '@/components/library/MediaCard';
import { LibraryAudioPlayer } from '@/components/library/LibraryAudioPlayer';
import { getMediaLibrary, getMoreMedia } from '../actions/library';
import { Media } from '@/types/database';

export default function AllMedia() {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'audio' | 'video'>('all');

  const loadMore = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const result = await getMoreMedia(state.page + 1, 12);

      if (result.error) {
        setError(result.error);
        return;
      }

      setState(prev => ({
        ...prev,
        media: [...prev.media, ...result.media],
        page: prev.page + 1,
        hasMore: result.hasMore,
        loading: false
      }));
    } catch (err) {
      console.log(err);
      
      setError('Failed to load more media');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const fetchInitialMedia = async () => {
      try {
        const result = await getMediaLibrary(12);
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
    };

    fetchInitialMedia();
  }, []);

  const handlePlay = (media: Media) => {
    setCurrentMedia(media);
  };

  const filteredMedia = state.media.filter(media => {
    const matchesSearch = media.title?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
    const matchesType = selectedType === 'all' || media.media_type === selectedType;
    return matchesSearch && matchesType;
  });

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
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold">Tous les médias</h2>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={selectedType === 'all' ? 'default' : 'outline'}
                            onClick={() => setSelectedType('all')}
                          >
                            Tous
                          </Button>
                          <Button
                            variant={selectedType === 'audio' ? 'default' : 'outline'}
                            onClick={() => setSelectedType('audio')}
                          >
                            Audio
                          </Button>
                          <Button
                            variant={selectedType === 'video' ? 'default' : 'outline'}
                            onClick={() => setSelectedType('video')}
                          >
                            Vidéo
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredMedia.map((item) => (
                        <MediaCard 
                          key={item.id} 
                          media={item} 
                          onPlay={handlePlay}
                        />
                      ))}
                    </div>

                    {state.hasMore && filteredMedia.length === state.media.length && (
                      <div className="mt-4 flex justify-center">
                        <Button
                          variant="outline"
                          onClick={loadMore}
                          disabled={state.loading}
                        >
                          {state.loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Charger plus'
                          )}
                        </Button>
                      </div>
                    )}

                    {filteredMedia.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Aucun média trouvé
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </main>
          </div>
        </div>

        <LibraryAudioPlayer 
          media={currentMedia} 
          onClose={() => setCurrentMedia(null)} 
        />
      </div>
    </AuthGuard>
  );
}
