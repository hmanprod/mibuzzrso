'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import Link from 'next/link';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { getWaveformUrl } from '@/lib/cloudinary';
import { Avatar } from '../ui/Avatar';
import { LoadingAnimation } from '../ui/LoadingAnimation';
import { formatTime } from '@/lib/utils';
import { getMediaReadsCount, markMediaAsRead } from '@/actions/interactions/interaction';
import { useSession } from '@/components/providers/SessionProvider';
import { useMediaControl } from '../providers/MediaControlProvider';

interface AudioPlayerProps {
  audioUrl: string;
  mediaId: string;
  postId: string;
  coverUrl?: string;
  comments: {
    id: string;
    timestamp: number;
    content: string;
    author: {
      id: string;
      stage_name: string;
      avatar_url: string | null;
      username: string;
    };
  }[];
  onCommentAdded?: (content: string, timestamp: number) => Promise<void>;
  onTimeUpdate?: (time: number) => void;
  downloadable?: boolean;
}

interface AudioPlayerRef {
  seekToTime: (time: number) => void;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ audioUrl, mediaId, postId, coverUrl, comments, onTimeUpdate, downloadable }, ref) => {
  const { user } = useSession();
  const { register, unregister, play } = useMediaControl();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [readsCount, setReadsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const processedAudioUrlRef = useRef<string>(audioUrl);
  const waveformUrl = getWaveformUrl(audioUrl);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      const duration = audio.duration;
      if (Number.isFinite(duration)) {
        setDuration(duration);
      }
    };

    // Vérifier si l'audio est déjà chargé
    if (audio.readyState >= 2) {
      handleLoadedMetadata();
    }

    // Ajouter l'event listener
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Cleanup function
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };

    if (!/\.wav$/i.test(audioUrl)) {
      processedAudioUrlRef.current = audioUrl.replace('.mp3', '.wav');
    } else {
      processedAudioUrlRef.current = audioUrl;
    }

  }, [audioRef, audioUrl]);

  // Fetch the number of reads for this media
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

  // Fetch reads count on mount
  useEffect(() => {
    fetchReadsCount();
  }, [fetchReadsCount]);

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
      
      // Update the reads count locally after marking as read
      setReadsCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking media as read:', error);
    }
  }, [user, mediaId, postId]);

  // Mark media as read when it's played for at least 5 seconds
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

  // Register this player with the media controller
  useEffect(() => {
    if (!mediaId) return;
    
    const pause = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    register(mediaId, pause);
    return () => unregister(mediaId);
  }, [mediaId, register, unregister]);

  const togglePlay = async () => {
    if (!audioRef.current || !mediaId) return;

    try {
      setIsLoading(true);
      if (isPlaying) {
        await audioRef.current.pause();
        setIsPlaying(false);
      } else {
        play(mediaId); // Notify the controller that we're playing
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime;
      setCurrentTime(newTime);
      if (onTimeUpdate) {
        onTimeUpdate(newTime);
      }
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (waveformRef.current && audioRef.current) {
      const rect = waveformRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    seekToTime: (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
        
        // Start playing if not already playing
        if (!isPlaying) {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error('Error playing audio:', error);
            });
        }
      }
    }
  }));

  return (
    <div className="rounded-[18px] p-4">
      <audio
        ref={audioRef}
        src={processedAudioUrlRef.current}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Contrôles principaux */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="w-10 h-10 flex items-center justify-center bg-primary rounded-full hover:bg-primary/90 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-6 h-6">
              <LoadingAnimation />
            </div>
          ) : isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 min-w-[30px]">
            {formatTime(currentTime)}
          </span>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm text-gray-600 min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={toggleMute}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" onClick={toggleMute} />
            ) : (
              <Volume2 className="w-4 h-4" onClick={toggleMute} />
            )}
          </button>
          <span className="text-sm text-gray-600">{readsCount} lectures</span>
          
        </div>
        </div>

        {downloadable && (
            <a
              href={audioUrl}
              download
              className="flex items-center gap-2 rounded-full hover:bg-gray-200 transition-colors text-sm"
              title="Télécharger l'audio"
              style={{ right: 0 }}
            >
              Télécharger
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
            </a>
          )}
      </div>

      {/* Container for cover and waveform */}
      <div className="flex gap-4">
        {/* Cover image */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-black/90 rounded-lg overflow-hidden">
          {coverUrl && !coverUrl.includes('cloudinary.com/video/upload/') && (
            <Image
              src={coverUrl}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Waveform with comment markers */}
        <div 
          ref={waveformRef} 
          className="relative flex-1 h-24 bg-gray-100 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleWaveformClick}
        >
        {/* Waveform image */}
        <div className="absolute inset-0">
          <Image
            src={waveformUrl}
            alt="Audio waveform"
            fill
            style={{ objectFit: 'fill' }}
          />
        </div>
        
        {/* Progress overlay */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-blue-500 opacity-30"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        
        {/* Comment markers */}
        {comments.map((comment) => (
          <div 
            key={comment.id}
            className="absolute group"
            style={{ left: `${(comment.timestamp / duration) * 100}%`, bottom: 0 }}
          >
            <div
              className="w-1 h-4 bg-red-500 transform -translate-x-1/2 cursor-pointer hover:h-6 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                if (audioRef.current) {
                  audioRef.current.currentTime = comment.timestamp;
                  setCurrentTime(comment.timestamp);
                }
              }}
            />
            {/* Floating tooltip - positioned relative to the viewport to avoid positioning issues */}
            <div className="fixed transform -translate-x-1/2 hidden group-hover:block bg-white rounded-lg shadow-lg p-2 w-48 z-10"
                 style={{ 
                   left: `calc(${(comment.timestamp / duration) * 100}% + var(--marker-offset, 0px))`, 
                   bottom: 'calc(var(--waveform-bottom, 100px) + 20px)'
                 }}
                 ref={(el) => {
                   if (el) {
                     // Calculate the offset to keep the tooltip within the viewport
                     const parentRect = el.parentElement?.getBoundingClientRect();
                     if (parentRect) {
                       el.style.setProperty('--marker-offset', `${parentRect.left}px`);
                       el.style.setProperty('--waveform-bottom', `${window.innerHeight - parentRect.bottom}px`);
                     }
                   }
                 }}
            >
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${comment.author.username || ''}`}>
                    <Avatar
                      src={comment.author.avatar_url || null}
                      stageName={comment.author.stage_name || null}
                      size={20}
                    />
                  </Link>
                  <span className="text-sm font-medium">{comment.author.stage_name || comment.author.username}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {comment.content.length > 50 
                    ? `${comment.content.substring(0, 50)}...` 
                    : comment.content}
                </p>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
