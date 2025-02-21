'use client';

import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface FeedProps {
  className?: string;
}

export default function Feed({ className }: FeedProps) {
  const posts = [
    {
      id: 1,
      user: {
        name: 'neoblade',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop'
      },
      title: 'shadowpulse',
      genre: 'Électronique',
      duration: '02:45',
      likes: 10,
      comments: 3
    },
    {
      id: 2,
      user: {
        name: 'K4L6E89',
        image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=100&h=100&fit=crop'
      },
      title: 'NRAK- K4L6E89',
      genre: 'Hip Hop',
      duration: '02:16',
      likes: 8,
      comments: 1
    }
  ];

  return (
    <div className={twMerge("space-y-4", className)}>
      {posts.map(post => (
        <article key={post.id} className="bg-white rounded-[18px] shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={post.user.image} alt={post.user.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h3 className="font-semibold text-base text-[#2D2D2D]">{post.user.name}</h3>
                  <p className="text-sm text-[#666666]">@{post.user.name.toLowerCase()}</p>
                </div>
              </div>
              <button className="text-[#FA4D4D] font-medium text-sm hover:text-[#E63F3F] transition-colors">
                Suivre
              </button>
            </div>
            
            <div className="bg-[#FAFAFA] rounded p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-base text-[#2D2D2D]">{post.title}</h4>
                  <p className="text-sm text-[#666666]">{post.genre} • {post.duration}</p>
                </div>
                <button className="bg-[#F2F2F2] text-[#666666] px-3 py-1 rounded-[18px] text-sm font-medium hover:bg-[#FAFAFA] transition-colors">
                  Dupliquer
                </button>
              </div>
              <div className="relative h-12 bg-[#F2F2F2] rounded">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-[18px] flex items-center justify-center cursor-pointer hover:bg-[#F2F2F2] transition-colors">
                    <div className="w-0 h-0 border-l-8 border-l-[#2D2D2D] border-y-[6px] border-y-transparent ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FAFAFA]">
                  <div className="h-full w-0 bg-[#FA4D4D]" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-[#666666] hover:text-[#FA4D4D] transition-colors">
                <Heart className="h-5 w-5" />
                <span className="text-sm">{post.likes}</span>
              </button>
              <button className="flex items-center gap-1 text-[#666666] hover:text-[#FA4D4D] transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">{post.comments}</span>
              </button>
              <button className="flex items-center gap-1 text-[#666666] hover:text-[#FA4D4D] transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
              <button className="flex items-center gap-1 text-[#666666] hover:text-[#FA4D4D] transition-colors ml-auto">
                <Bookmark className="h-5 w-5" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
