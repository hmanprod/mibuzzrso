'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { getWaveformUrl } from '@/lib/cloudinary';
import { Avatar } from '../ui/Avatar';
import { formatTime } from '@/lib/utils';
import { getMediaReadsCount, markMediaAsRead } from '@/app/feed/actions';
import { useSession } from '@/components/providers/SessionProvider';

interface AudioPlayerProps {
  audioUrl: string;
  mediaId: string;
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
  onCommentAdded?: () => Promise<void>;
  onTimeUpdate?: (time: number) => void;
}

interface AudioPlayerRef {
  seekToTime: (time: number) => void;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ audioUrl, mediaId, comments, onTimeUpdate }, ref) => {
  const { user } = useSession();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [readsCount, setReadsCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveformUrl = getWaveformUrl(audioUrl);

  useEffect(() => {
    
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
    }
  }, [audioRef]);

  // Fetch the number of reads for this media
  const fetchReadsCount = async () => {
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
  };

  // Fetch reads count on mount
  useEffect(() => {
    fetchReadsCount();
  }, [mediaId, fetchReadsCount]);

  // Track if we've already counted this session
  const hasTrackedThisSession = useRef(false);

  const handleMarkAsRead = async () => {
    if (!user || !mediaId) return;
    
    try {
      const { error } = await markMediaAsRead(mediaId);
      
      if (error) {
        console.error('Error marking media as read:', error);
        return;
      }
      
      // Update the reads count locally after marking as read
      setReadsCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking media as read:', error);
    }
  };

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
  }, [currentTime, user, mediaId]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
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
    <div className="bg-white rounded-[18px] p-4 space-y-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Contrôles principaux */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8" onClick={togglePlay} />
          ) : (
            <Play className="w-8 h-8" onClick={togglePlay} />
          )}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm text-gray-600 min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6" onClick={toggleMute} />
            ) : (
              <Volume2 className="w-6 h-6" onClick={toggleMute} />
            )}
          </button>
          <span className="text-sm text-gray-600">{readsCount} lectures</span>
        </div>
      </div>

      {/* Waveform with comment markers */}
      <div 
        ref={waveformRef} 
        className="relative h-24 bg-gray-100 rounded-lg cursor-pointer overflow-hidden"
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
                  <Avatar
                    src={comment.author.avatar_url || null}
                    stageName={comment.author.stage_name || null}
                    size={20}
                  />
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
  );
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
