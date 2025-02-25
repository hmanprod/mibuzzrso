'use client';

import { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';
import type { Post, Media, Profile } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

// interface Comment {
//   id: string;
//   timestamp: number;
//   content: string;
//   author: Profile;
//   position?: { x: number; y: number };
// }

interface FeedPostProps extends Post {
  profile: Profile;
  media: Media[];
  likes: number;
  is_liked: boolean;
}

export default function FeedPost({
  id,
  profile,
  content,
  media,
  likes,
  is_liked,
}: FeedPostProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(is_liked);
  const [likesCount, setLikesCount] = useState(likes);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get the first media item (for now we'll just handle single media)
  const mediaItem = media[0];

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const supabase = createClient();
      
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setLikesCount(prev => prev - 1);
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: id, user_id: user.id });
          
        if (error) throw error;
        
        setLikesCount(prev => prev + 1);
      }
      
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    // TODO: Implement proper sharing
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <article className="bg-white rounded-[18px] shadow-sm overflow-hidden">
      {/* Post header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={profile?.avatar_url || null}
            stageName={profile?.stage_name}
            size={40}
            className="rounded-full"
          />

          <div>
            <h3 className="font-medium text-[#2D2D2D]">{profile.stage_name}</h3>
            <p className="text-sm text-gray-500">@{profile.id}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Title and description */}
      {mediaItem && (
        <div className="px-4 pb-4">
          <h2 className="text-lg font-semibold text-[#2D2D2D]">{mediaItem?.title || 'Untitled'}</h2>
          {mediaItem.description && (
            <p className="mt-1 text-gray-600">{mediaItem.description}</p>
          )}
        </div>
      )}

      {/* Media player */}
      {mediaItem && (
        mediaItem.media_type === 'audio' ? (
          <AudioPlayer
            audioUrl={mediaItem.media_url}
            waveformData={[]} // TODO: Add waveform data to Media type
            comments={[]} // TODO: Implement comments
          />
        ) : (
          <VideoPlayer 
          videoUrl={mediaItem.media_url} 
          comments={[]} // TODO: Implement comments
          />
        )
      )}

      {/* Title and description */}
      <div className="px-4 pb-4">
        {content && (
          <p className="text-gray-600">{content}</p>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 flex items-center gap-6">
        <button 
          className={`flex items-center gap-2 ${liked ? 'text-red-500' : 'text-gray-600'} ${loading ? 'opacity-50' : 'hover:text-red-500'} transition-colors`}
          onClick={toggleLike}
          disabled={loading}
        >
          <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
          <span>{likesCount}</span>
        </button>
        <button 
          className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-6 h-6" />
          <span>0</span>
        </button>
        <button 
          className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
          onClick={handleShare}
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Comments section - TODO: Implement */}
      {showComments && (
        <div className="border-t border-gray-100 p-4">
          <p className="text-gray-500 text-center">Comments coming soon</p>
        </div>
      )}
    </article>
  );
}
