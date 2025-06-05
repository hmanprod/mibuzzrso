import { useCallback, useEffect, useState } from 'react';
import { ExtendedPost } from '@/types/database';
import { getPosts } from '@/actions/posts/post';

export interface FeedState {
  posts: ExtendedPost[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  loadingMore: boolean;
}

export interface FeedActions {
  loadPosts: (isInitial?: boolean) => Promise<void>;
  handleScroll: () => void;
  handleCreatePost: () => void;
}

export function useFeed(): [FeedState, FeedActions] {
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = useCallback(async (isInitial: boolean = true) => {
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

  // Function to handle infinite scroll
  const handleScroll = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 800;

    if (scrollPosition > threshold) {
      loadPosts(false);
    }
  }, [loading, loadingMore, hasMore, loadPosts]);

  // Initial load
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleCreatePost = () => {
    loadPosts();
  };

  return [
    {
      posts,
      loading,
      error,
      page,
      hasMore,
      loadingMore
    },
    {
      loadPosts,
      handleScroll,
      handleCreatePost
    }
  ];
}
