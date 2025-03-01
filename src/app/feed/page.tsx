'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import FeedPost from '@/components/feed/FeedPost';
import FeedPostSkeleton from '@/components/feed/FeedPostSkeleton';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import CreatePostBlock from '@/components/feed/CreatePostBlock';
import { AuthGuard } from '@/components/auth/AuthGuard';
import type { Post, Media, Profile } from '@/types/database';
import { getPosts } from './actions/post';
import { getTopInteractingUsers } from '@/app/profile/actions/profile';

interface ExtendedPost extends Post {
  profile: Profile;
  media: Media[];
  likes: number;
  is_liked: boolean;
  is_followed: boolean;
}

interface TopUser {
  user_id: string;
  avatar_url: string | null;
  stage_name: string;
  interaction_score: number;
  is_followed: boolean;
}

export default function Home() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadTopUsers = useCallback(async () => {
    try {
      const { data, error } = await getTopInteractingUsers();
      if (!error && data) {
        // Transform the data to match the expected format for SuggestedUsers
        const formattedUsers = data.map((user: TopUser) => ({
          user_id: user.user_id,
          avatar_url: user.avatar_url,
          stage_name: user.stage_name,
          interaction_score: user.interaction_score,
          is_followed: user.is_followed
        }));
        
        setTopUsers(formattedUsers.slice(0, 3));
        // console.log('✨ Top users loaded:', formattedUsers.slice(0, 3));
      } else if (error) {
        console.error('Error in getTopInteractingUsers response:', error);
      }
    } catch (err) {
      console.error('Error loading top users:', err);
    }
  }, []);

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

      if (isInitial) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
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
    loadTopUsers();
  }, [loadPosts, loadTopUsers]);

  

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
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar className="fixed top-0 left-0 right-0 z-50" />
        
        <div className="flex pt-[72px]">
          <Sidebar className="fixed left-0 bottom-0 top-[72px] w-[274px]" />
          
          <div className="flex flex-1 ml-[274px]">
            {/* Feed central */}
            <main className="flex-1 max-w-[600px] w-full mx-auto py-4 px-4 sm:px-0">
              <CreatePostBlock onOpen={() => setShowCreatePost(true)} />
              
              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-lg mt-4">
                  {error}
                </div>
              )}

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
            </main>
            
            <RightSidebar className="w-[350px] py-8" suggestedUsers={topUsers} />
          </div>
        </div>
      </div>

      <CreatePostDialog
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
      />
    </AuthGuard>
  );
}
