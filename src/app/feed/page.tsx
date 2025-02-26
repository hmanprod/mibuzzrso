'use client';

import { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import FeedPost from '@/components/feed/FeedPost';
import FeedPostSkeleton from '@/components/feed/FeedPostSkeleton';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import CreatePostBlock from '@/components/feed/CreatePostBlock';
import { AuthGuard } from '@/components/auth/AuthGuard';
import type { Post, Media, Profile } from '@/types/database';
import { getPosts } from './actions';

interface ExtendedPost extends Post {
  profile: Profile;
  media: Media[];
  likes: number;
  is_liked: boolean;
}

export default function Home() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    console.log('🔄 Loading posts...');
    try {
      setLoading(true);
      setError(null);

      const result = await getPosts();
      
      if (result.error) {
        throw new Error(result.error);
      }

      console.log('✨ Posts loaded:', result.posts);
      setPosts(result.posts || []);
    } catch (err) {
      console.error('❌ Error loading posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (formData: FormData) => {
    try {
      const result = await createPost(formData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Reload posts after successful creation
      await loadPosts();
      setShowCreatePost(false);
    } catch (err) {
      console.error('❌ Error creating post:', err);
      // Handle error in the UI as needed
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar className="fixed top-0 left-0 right-0 z-50" />
        
        <div className="flex pt-[72px]">
          <Sidebar className="fixed left-0 bottom-0 top-[72px] w-[274px]" />
          
          <div className="flex flex-1 ml-[274px]">
            {/* Feed central */}
            <main className="flex-1 max-w-[744px] mx-auto px-8 py-8">
              <CreatePostBlock onOpen={() => setShowCreatePost(true)} />
              
              <div className="mt-8 space-y-4">
                {loading ? (
                  // Show skeletons while loading
                  Array.from({ length: 3 }).map((_, i) => (
                    <FeedPostSkeleton key={i} />
                  ))
                ) : error ? (
                  // Show error message
                  <div className="p-4 rounded-lg bg-red-50 text-red-600">
                    {error}
                  </div>
                ) : posts.length === 0 ? (
                  // Show empty state
                  <div className="text-center text-gray-500">
                    No posts yet. Be the first to post!
                  </div>
                ) : (
                  // Show posts
                  posts.map((post) => (
                    <FeedPost
                      key={post.id}
                      post={post}
                      onPostUpdated={loadPosts}
                    />
                  ))
                )}
              </div>
            </main>
            
            <RightSidebar className="w-[274px] shrink-0" />
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
