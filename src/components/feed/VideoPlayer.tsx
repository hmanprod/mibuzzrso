'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Eye } from 'lucide-react';
import Image from 'next/image';
import { formatTime } from '@/lib/utils';
import { getMediaReadsCount, markMediaAsRead } from '@/app/feed/actions/interaction';
import { useSession } from '@/components/providers/SessionProvider';

interface VideoPlayerProps {
  videoUrl: string;
  mediaId: string;
  postId: string;
  comments: {
    id: string;
    timestamp: number;
    content: string;
    position?: { x: number; y: number };
    author: {
      id: string;
      stage_name: string;
      avatar_url: string | null;
      username: string;
    };
  }[];
  onCommentAdded?: () => Promise<void>;
  onTimeUpdate?: (time: number) => void;
}

interface VideoPlayerRef {
  seekToTime: (time: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoUrl, mediaId, postId, comments, onTimeUpdate }, ref) => {
  const { user } = useSession();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [readsCount, setReadsCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if we've already counted this session
  const hasTrackedThisSession = useRef(false);

  const handleMarkAsRead = useCallback(async () => {
    if (!user || !mediaId) return;
    
    try {
      const { error } = await markMediaAsRead(mediaId, postId);
      
      if (error) {
        console.error('Error marking media as read:', error);
        return;
      }
      
      setReadsCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking media as read:', error);
    }
  }, [user, mediaId, postId]);

  const fetchReadsCount = useCallback(async () => {
    if (!mediaId) return;
    
    try {
      const { count, error } = await getMediaReadsCount(mediaId);
      if (error) {
        console.error('Error fetching reads count:', error);
        return;
      }
      
      setReadsCount(count);
    } catch (error) {
      console.error('Error fetching reads count:', error);
    }
  }, [mediaId]);

  useEffect(() => {
    fetchReadsCount();
  }, [fetchReadsCount]);

  useEffect(() => {
    const markAsReadAfterPlaying = async () => {
      // Only mark as read once per session when the user has played at least 5 seconds
      if (currentTime >= 5 && user && mediaId && !hasTrackedThisSession.current) {
        try {
          hasTrackedThisSession.current = true;
          await handleMarkAsRead();
        } catch (error) {
          console.error('Error marking media as read:', error);
        }
      }
    };
    
    markAsReadAfterPlaying();
  }, [currentTime, user, mediaId, handleMarkAsRead]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', () => {
        setDuration(videoRef.current?.duration || 0);
      });

      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('msfullscreenchange', handleFullscreenChange);

      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      };
    }
  }, [controlsTimeoutRef]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(videoRef.current.currentTime);
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    seekToTime: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
        
        // Start playing if not already playing
        if (!isPlaying) {
          videoRef.current.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error('Error playing video:', error);
            });
        }
      }
    }
  }));

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-[18px] overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Commentaires sur la vidéo */}
      {comments.map((comment) => (
        comment.position && (
          <div
            key={comment.id}
            className="absolute"
            style={{
              left: `${comment.position.x}%`,
              top: `${comment.position.y}%`,
            }}
          >
            <div className="relative group">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white cursor-pointer">
                <span className="text-xs">+</span>
              </div>
              <div className="absolute left-full ml-2 hidden group-hover:block bg-white rounded-lg shadow-lg p-2 w-48">
                <div className="flex items-center gap-2 mb-1">
                  <Image
                    src={comment.author.avatar_url || '/images/default-avatar.png'}
                    alt={`${comment.author.stage_name}'s avatar`}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium">{comment.author.stage_name}</span>
                </div>
                <p className="text-sm text-gray-600">{comment.content}</p>
              </div>
            </div>
          </div>
        )
      ))}

      {/* Contrôles */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Barre de progression */}
          <div
            className="h-1 bg-gray-600 rounded cursor-pointer relative"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-primary rounded"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Marqueurs de commentaires */}
            {comments.map((comment) => {
              const position = (comment.timestamp / duration) * 100;
              return (
                <div
                  key={comment.id}
                  className="absolute top-0 w-1 h-full bg-white opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                  style={{ left: `${position}%` }}
                  title={comment.content}
                />
              );
            })}
          </div>

          {/* Contrôles principaux */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-200 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              <div className="flex items-center gap-2 text-white">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-200 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6" />
              ) : (
                <Maximize className="w-6 h-6" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <Eye className="w-6 h-6 text-white" />
              <span className="text-sm text-white">{readsCount} lectures</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
