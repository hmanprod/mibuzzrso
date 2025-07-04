'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';
import FeedPost from '@/components/feed/FeedPost';
import FeedPostSkeleton from '@/components/feed/FeedPostSkeleton';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import CreatePostBlock from '@/components/feed/CreatePostBlock';
import type { ExtendedPost } from '@/types/database';
import { getPosts } from '../../actions/posts/post';

export default function Home() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1); // Utiliser useRef pour page

  const loadPosts = useCallback(async (isInitial: boolean = true) => {
    // console.log('🔄 Loading posts...', isInitial ? 'Initial load' : `Loading page ${pageRef.current}`);
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
        pageRef.current = 1; // Réinitialiser la page pour le chargement initial
      } else {
        setLoadingMore(true);
      }

      const result = await getPosts(pageRef.current);
      // console.log('📡 API result:', result);

      if (result.error) {
        throw new Error(result.error);
      }

      const newPosts = result.posts || [];
      // console.log('✨ Posts loaded:', newPosts.length, newPosts);

      if (isInitial) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter((post: ExtendedPost) => !existingIds.has(post.id));
          return [...prev, ...uniqueNewPosts];
        });
      }

      // Déterminer s'il y a plus de posts à charger
      setHasMore(newPosts.length === 5); // Ajuster selon la logique de l'API
      if (!isInitial && newPosts.length === 5) {
        pageRef.current += 1; // Incrémenter la page
        console.log('📈 Page incremented to:', pageRef.current);
      }
    } catch (err) {
      console.error('❌ Error loading posts:', err);
      setError('Failed to load posts. Please try again later.');
      setHasMore(false); // Arrêter le chargement en cas d'erreur
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleScroll = useMemo(
    () => debounce(() => {
      if (loading || loadingMore || !hasMore) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 800;

      if (scrollPosition > threshold) {
        console.log('🚀 Triggering load more, page:', pageRef.current);
        loadPosts(false);
      }
    }, 200),
    [loading, loadingMore, hasMore, loadPosts]
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleCreatePost = async () => {
    await loadPosts(); // Recharger les posts après création
    setShowCreatePost(false);
  };

  return (
    <>
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
            <FeedPost key={post.id} post={post} />
          ))}

          {loadingMore && (
            Array.from({ length: 3 }).map((_, i) => (
              <FeedPostSkeleton key={i} />
            ))
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
    </>
  );
}