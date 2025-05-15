'use client';

import { useState, useEffect, useCallback } from 'react';
import FeedPost from '@/components/feed/FeedPost';
import FeedPostSkeleton from '@/components/feed/FeedPostSkeleton';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import CreatePostBlock from '@/components/feed/CreatePostBlock';
import type { ExtendedPost } from '@/types/database';
import { getPosts } from './actions/post';

import PageContainer from '@/components/layouts/PageContainer';
import MainContent from '@/components/layouts/MainContent';

export default function Home() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = useCallback(async (isInitial: boolean = true) => {
    // console.log('🔄 Loading posts...', isInitial ? 'Initial load' : 'Loading more');
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const result = await getPosts(isInitial ? 1 : page);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const newPosts = result.posts || [];
      // console.log('✨ Posts loaded:', newPosts.length);
      // console.log('✨ Posts loaded:', newPosts);

      if (isInitial) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter((post: ExtendedPost) => !existingIds.has(post.id));
          return [...prev, ...uniqueNewPosts];
        });
      }

      setHasMore(newPosts.length === 5);
      if (!isInitial && newPosts.length === 5) {
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('❌ Error loading posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);


  // Function to handle infinite scroll
  const handleScroll = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 800;

    if (scrollPosition > threshold) {
      loadPosts(false);
    }
  }, [loading, loadingMore, hasMore, loadPosts]);

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleCreatePost = async () => {
      await loadPosts();
      setShowCreatePost(false);
  };

  return (
    <PageContainer>
      <MainContent>
        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <CreatePostBlock onClick={() => setShowCreatePost(true)} />

        {loading && !posts.length ? (
          Array.from({ length: 3 }).map((_, i) => (
            <FeedPostSkeleton key={i} />
          ))
        ) : (
          <>
            {posts.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
              />
            ))}
            
            {loadingMore && (
              <FeedPostSkeleton />
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center text-gray-500 mt-8">
                No more posts to load
              </div>
            )}
          </>
        )}
        <CreatePostDialog
          open={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
        />
      </MainContent>
    </PageContainer>
  
  );
}
