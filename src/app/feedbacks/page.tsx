'use client';

import { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateFeedbackDialog, FeedbackCard } from '@/components/feedback';
import { getFeedbacks } from './actions/feedback';
import { Feedback } from '@/types/feedback';



export default function FeedbacksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadFeedbacks = async (pageNum: number = 1) => {
    try {
      const result = await getFeedbacks(pageNum);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.posts) {
        if (pageNum === 1) {
          setFeedbacks(result.posts);
        } else {
          setFeedbacks(prev => [...prev, ...result.posts]);
        }
        setHasMore(result.posts.length === result.limit);
      }
    } catch (err) {
      setError('Failed to load feedbacks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFeedbacks(nextPage);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar className="fixed top-0 left-0 right-0 z-50" />
        
        <div className="flex pt-[72px]">
          <Sidebar className="fixed left-0 bottom-0 top-[72px] w-[274px]" />
          
          <div className="flex flex-1 ml-[274px]">
            <main className="flex-1 w-full mx-auto py-4 px-4 sm:px-0 max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Feedback & Idées</h1>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Partager une idée
                </Button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-[18px] shadow-sm p-4 animate-pulse">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-1/6" />
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                  {error}
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <FeedbackCard
                      key={feedback.id}
                      feedback={feedback}
                      onDelete={() => loadFeedbacks()}
                    />
                  ))}
                  
                  {hasMore && (
                    <div className="text-center py-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={loading}
                      >
                        {loading ? 'Chargement...' : 'Voir plus'}
                      </Button>
                    </div>
                  )}

                  {!hasMore && feedbacks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Aucun feedback pour le moment
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <CreateFeedbackDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={() => {
          loadFeedbacks();
          setIsCreateDialogOpen(false);
        }}
      />
    </AuthGuard>
  );
}
