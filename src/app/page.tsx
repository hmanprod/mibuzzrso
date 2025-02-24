'use client';

import { useState } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import FeedPost from '@/components/feed/FeedPost';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import CreatePostBlock from '@/components/feed/CreatePostBlock';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';

// Données de test
const mockPosts = [
  {
    id: '1',
    author: {
      id: '1',
      name: 'John Doe',
      image: '/placeholder-user.jpg',
      username: 'johndoe',
    },
    title: 'Ma dernière composition',
    description: 'Un petit morceau que j\'ai composé hier soir. Dites-moi ce que vous en pensez !',
    type: 'audio' as const,
    mediaUrl: '/sample-audio.mp3',
    waveformData: Array(100).fill(0).map(() => Math.random() * 100),
    comments: [
      {
        id: '1',
        timestamp: 45,
        content: 'J\'adore cette partie !',
        author: {
          id: '2',
          name: 'Jane Smith',
          image: '/placeholder-user-2.jpg',
          username: 'janesmith',
        },
      },
    ],
    likes: 42,
    createdAt: '2025-02-21T15:00:00.000Z',
    isLiked: false,
  },
  {
    id: '2',
    author: {
      id: '2',
      name: 'Jane Smith',
      image: '/placeholder-user-2.jpg',
      username: 'janesmith',
    },
    title: 'Session live acoustique',
    description: 'Une petite session acoustique improvisée',
    type: 'video' as const,
    mediaUrl: '/sample-video.mp4',
    comments: [
      {
        id: '2',
        timestamp: 120,
        content: 'Superbe performance !',
        author: {
          id: '1',
          name: 'John Doe',
          image: '/placeholder-user.jpg',
          username: 'johndoe',
        },
        position: { x: 50, y: 50 },
      },
    ],
    likes: 128,
    createdAt: '2025-02-21T14:30:00.000Z',
    isLiked: true,
  },
];

export default function Home() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar className="fixed top-0 left-0 right-0 z-50" />
        
        <div className="flex pt-[72px]">
          <Sidebar className="fixed left-0 bottom-0 top-[72px] w-[274px]" />
          
          {/* Feed central */}
          <main className="ml-[274px] max-w-[720px] w-full p-6 space-y-6">
            {/* Bloc de création de post */}
            <CreatePostBlock
              onOpen={() => setShowCreatePost(true)}
            />

            {/* Liste des posts */}
            <div className="space-y-6">
              {mockPosts.map((post) => (
                <FeedPost key={post.id} {...post} />
              ))}
            </div>

            {/* Dialog de création de post */}
            {showCreatePost && (
              <CreatePostDialog
                isOpen={showCreatePost}
                onClose={() => setShowCreatePost(false)}
              />
            )}
          </main>
          
          {/* Sidebar droite */}
          <RightSidebar className="fixed right-0 bottom-0 top-[72px] w-[350px]" />
        </div>
      </div>
    </AuthGuard>
  );
}
