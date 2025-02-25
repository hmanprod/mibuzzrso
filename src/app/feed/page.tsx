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

import { supabase } from '@/lib/supabase';
import type { Post, Media, Profile } from '@/types/database';

interface PostMedia {
  media: Media;
}

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

      // Fetch posts with profiles and media
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles(*),
          media:posts_medias(
            media:medias(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('❌ Supabase error:', postsError);
        throw postsError;
      }

      if (!postsData) {
        console.log('⚠️ No posts data returned');
        return;
      }

      console.log('✨ Posts data:', postsData);
      console.log('📊 Number of posts:', postsData.length);

      // Transform the data to match our ExtendedPost interface
      const transformedPosts: ExtendedPost[] = postsData.map(post => {
        console.log('🔍 Processing post:', post.id, 'Profile:', post.profile, 'Media:', post.media);
        return {
          ...post,
          profile: post.profile || null,
          // Transform nested media structure
          media: post.media?.map((pm: PostMedia) => pm.media) || [],
          likes: 0, // We'll add likes back later
          is_liked: false
        };
      });

      console.log('🎯 Transformed posts:', transformedPosts);
      setPosts(transformedPosts);
    } catch (err) {
      console.error('❌ Error loading posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
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
            <main className="max-w-[720px] w-full p-3 space-y-3">
              {/* Bloc de création de post */}
              <CreatePostBlock
                onOpen={() => setShowCreatePost(true)}
              />

              {/* Debug refresh button */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={loadPosts}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-lg font-medium transition-colors"
                >
                  🔄 Refresh Posts (Debug)
                </button>
              )}

              {/* Loading state */}
              {loading && (
                <div className="space-y-6">
                  {[...Array(3)].map((_, index) => (
                    <FeedPostSkeleton key={index} />
                  ))}
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                  {error}
                </div>
              )}

              {/* Liste des posts */}
              {!loading && !error && (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <FeedPost key={post.id} {...post} />
                  ))}
                </div>
              )}

              {/* Dialog de création de post */}
              {showCreatePost && (
                <CreatePostDialog
                  isOpen={showCreatePost}
                  onClose={() => setShowCreatePost(false)}
                  onPostCreated={() => {
                    loadPosts(); // Reload posts after creation
                    setShowCreatePost(false);
                  }}
                />
              )}
            </main>
            
            {/* Sidebar droite */}
            <RightSidebar className="w-[350px] h-[calc(100vh-72px)] sticky top-[72px]" />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
