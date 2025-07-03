'use client';

import { useEffect, useState, useRef } from 'react';
import { Flame, MessageCircle } from 'lucide-react';
import type { Media } from '@/types/database';
import { cn } from '@/lib/utils';
import AudioPlayer from '../feed/AudioPlayer';
import VideoPlayer from '../feed/VideoPlayer';
import { toggleMediaLike, getMediaLikes, getCommentsByMediaId, addComment, type Comment } from '@/actions/interactions/interaction_musics';
import MediaCommentSection from './MediaCommentSection';

type MediaWithProfile = Media & {
  profile?: {
    id: string;
    avatar_url: string | null;
    stage_name: string;
  };
  likes?: number;
  is_liked?: boolean;
  post_id?: string;
};

interface LibraryMediaCardProps {
  media: MediaWithProfile;
}

export default function LibraryMediaCard({ media }: LibraryMediaCardProps) {
  const audioPlayerRef = useRef<{ seekToTime: (time: number) => void } | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(!!media.is_liked);
  const [likesCount, setLikesCount] = useState<number>(Number(media.likes) || 0);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [comments, setComments] = useState<Array<Comment & { position?: { x: number; y: number } }>>([]);
  // const [duration, setDuration] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);

  useEffect(() => {
    // Mettre à jour la durée quand le média change
    if (audioPlayerRef.current) {
      const audio = document.querySelector('audio');
      const video = document.querySelector('video');
      if (audio) {
        audio.addEventListener('loadedmetadata', () => {
          // setDuration(audio.duration);
        });
      } else if (video) {
        video.addEventListener('loadedmetadata', () => {
          // setDuration(video.duration);
        });
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Récupérer les likes
      const likesResult = await getMediaLikes(media.id);
      if (!likesResult.error) {
        setIsLiked(!!likesResult.isLiked);
        setLikesCount(Number(likesResult.count) || 0);
      }

      // Récupérer les commentaires
      const commentsResult = await getCommentsByMediaId(media.id);
      if (!commentsResult.error && commentsResult.comments) {
        setComments(commentsResult.comments);
      }
    };
    fetchData();
  }, [media.id]);

  const handleLike = () => {
    if (isLikeProcessing) return; // limite les double-clics très rapides
    const newIsLiked = !isLiked;
    // Mise à jour optimiste immédiate
    setIsLiked(newIsLiked);
    setLikesCount(prev => prev + (newIsLiked ? 1 : -1));
    setIsLikeProcessing(true);

    toggleMediaLike(media.id)
      .then(({ error, liked, likesCount: serverLikes }) => {
        if (error) {
          // rollback si le serveur échoue
          setIsLiked(!newIsLiked);
          setLikesCount(prev => prev + (newIsLiked ? -1 : 1));
          console.error('Error toggling like:', error);
        } else {
          // aligne avec la vérité serveur (au cas où le compteur diffère)
          setIsLiked(!!liked);
          if (serverLikes !== undefined) {
            setLikesCount(Number(serverLikes) || 0);
          }
        }
      })
      .catch((error) => {
        console.error('Error toggling like:', error);
        setIsLiked(!newIsLiked);
        setLikesCount(prev => prev + (newIsLiked ? -1 : 1));
      })
      .finally(() => {
        setTimeout(() => setIsLikeProcessing(false), 400);
      });
  };

  // const handlePlayClick = () => {
  //   setIsPlaying(!isPlaying);
  // };

  // const handleShare = () => {
  //   // Add share functionality here
  // };

  // console.log("the media", media);
  

  return (
    <div className="rounded-lg duration-200 flex flex-col">

      {/* Right side - Title, author, media player and actions */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 ml-4">
            <h3 className="font-semibold text-base text-[#333333] truncate">{media.profile?.stage_name} {media.profile?.stage_name ? ' - ' : ''} {media.title || 'Untitled'}</h3>
            <p className="text-xs text-[#666666] truncate">publié par <span className='font-bold'>{media.profile?.stage_name || 'Utilisateur inconnu'}</span></p>
          </div>
          {/* {!media.media_cover_url && (
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
          )} */}
        </div>

        {/* Media player */}
        <div className="relative overflow-hidden">
          {media.media_type === 'audio' ? (
            <AudioPlayer
              audioUrl={media.media_url}
              mediaId={media.id}
              coverUrl={media.media_cover_url}
              onTimeUpdate={(time) => setCurrentPlaybackTime(time)}
              ref={audioPlayerRef}
              comments={comments}
              onCommentAdded={async (content: string, timestamp: number) => {
                const result = await addComment(media.id, content, timestamp);
                if (result.success) {
                  // Recharger les commentaires
                  const commentsResult = await getCommentsByMediaId(media.id);
                  if (!commentsResult.error && commentsResult.comments) {
                    setComments(commentsResult.comments);
                  }
                }
              }}
              postId={media.post_id || ''}
              audioDuration={media.duration}
            />
          ) : (
            <VideoPlayer
              videoUrl={media.media_url}
              mediaId={media.id}
              onTimeUpdate={(time) => setCurrentPlaybackTime(time)}
              ref={audioPlayerRef}
              comments={comments}
              onCommentAdded={async (content: string, timestamp: number) => {
                const result = await addComment(media.id, content, timestamp);
                if (result.success) {
                  // Recharger les commentaires
                  const commentsResult = await getCommentsByMediaId(media.id);
                  if (!commentsResult.error && commentsResult.comments) {
                    setComments(commentsResult.comments);
                  }
                }
              }}
              postId={media.post_id || ''}
            />
          )}
        </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2 ml-4 mb-3">
            <button
              className="flex items-center gap-2" onClick={handleLike}
            >
              <Flame
                className={cn(
                  "w-5 h-5 transition-colors",
                  isLiked ? "fill-[#E94135] stroke-[#E94135]" : "stroke-gray-500 hover:stroke-gray-700"
                )}
              />
              <span className="text-sm text-gray-500">{likesCount}</span>
            </button>
            <button
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"

            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{comments.length}</span>
            </button>
            {/* <button
              onClick={handleShare}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Share className="w-5 h-5" />
            </button> */}
          </div>

          <MediaCommentSection
            mediaId={media.id}
            comments={comments}
            currentPlaybackTime={currentPlaybackTime}
            onCommentAdded={async () => {
              const commentsResult = await getCommentsByMediaId(media.id);
              if (!commentsResult.error && commentsResult.comments) {
                setComments(commentsResult.comments);
              }
            }}
            onSeekToTime={(time) => {
              if (audioPlayerRef.current) {
                audioPlayerRef.current.seekToTime(time);
              }
            }}
          />
        </div>
    </div>

  );
}
