'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Pause, Play, Share } from 'lucide-react';
import type { Media } from '@/types/database';
import { cn } from '@/lib/utils';
import AudioPlayer from '../feed/AudioPlayer';
import VideoPlayer from '../feed/VideoPlayer';

interface LibraryMediaCardProps {
  media: Media;
}

export default function LibraryMediaCard({ media }: LibraryMediaCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);

  const handleLike = async () => {
    setIsLikeProcessing(true);
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsLikeProcessing(false);
  };

  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
  };

  const handleShare = () => {
    // Add share functionality here
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex">
      {/* Left side - Cover image and play button */}
      {media.media_cover_url && (
        <div className="relative w-40 aspect-square flex-shrink-0">
          <Image
            src={media.media_cover_url}
            alt={media.title || 'Media cover'}
            fill
            className="object-cover"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group">
            <button
              onClick={handlePlayClick}
              className="p-2.5 rounded-full bg-white/90 hover:bg-white transition-colors duration-200 shadow-lg group-hover:scale-110 transform transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-[#E94135]" />
              ) : (
                <Play className="w-5 h-5 text-[#E94135]" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Right side - Title, author, media player and actions */}
      <div className="flex-1 p-4 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0 flex-1 mr-4">
            <h3 className="font-semibold text-base text-[#333333] truncate">{media.title || 'Untitled'}</h3>
            <p className="text-sm text-[#666666] truncate">{media.author}</p>
          </div>
          {!media.media_cover_url && (
            <button
              onClick={handlePlayClick}
              className="p-2 rounded-full bg-[#E94135]/10 hover:bg-[#E94135]/20 transition-colors duration-200 flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-[#E94135]" />
              ) : (
                <Play className="w-5 h-5 text-[#E94135]" />
              )}
            </button>
          )}
        </div>

        {/* Media player */}
        <div className="relative overflow-hidden">
          {media.media_type === 'audio' ? (
            <AudioPlayer
              audioUrl={media.media_url}
              mediaId={media.id}
              onTimeUpdate={() => {}}
              ref={null}
              comments={[]}
              onCommentAdded={async () => {}}
              postId=""
            />
          ) : (
            <VideoPlayer
              videoUrl={media.media_url}
              mediaId={media.id}
              onTimeUpdate={() => {}}
              ref={null}
              comments={[]}
              onCommentAdded={async () => {}}
              postId=""
            />
          )}
        </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              className={`flex items-center gap-2 ${isLikeProcessing ? 'opacity-50 cursor-wait' : ''}`}
              onClick={handleLike}
              disabled={isLikeProcessing}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-colors",
                  isLiked ? "fill-[#E94135] stroke-[#E94135]" : "stroke-gray-500 hover:stroke-gray-700"
                )}
              />
              <span className="text-sm text-gray-500">{likesCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Share className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

  );
}
