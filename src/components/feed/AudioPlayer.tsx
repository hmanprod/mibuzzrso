// Forcing a re-lint
'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import Link from 'next/link';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { Avatar } from '../ui/Avatar';
import { LoadingAnimation } from '../ui/LoadingAnimation';
import { formatTime } from '@/lib/utils';
import { getMediaReadsCount, markMediaAsRead } from '@/actions/interactions/interaction';
import { useSession } from '@/components/providers/SessionProvider';
import { useMediaControl } from '../providers/MediaControlProvider';

// --- Helper functions to draw the waveform on a canvas ---
const drawPlaceholderWaveform = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  const centerY = height / 2;
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#e5e7eb'; // Light grey for placeholder
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
};
const drawWaveform = (
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer,
  progress: number
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / width);
  const amp = height / 2;

  ctx.clearRect(0, 0, width, height);
  
  // Draw the background waveform (unplayed part)
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#6b7280'; // dark grey
  ctx.beginPath();
  for (let i = 0; i < width; i++) {
    let min = 1.0, max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = data[i * step + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    ctx.moveTo(i, amp * (1 + min));
    ctx.lineTo(i, amp * (1 + max));
  }
  ctx.stroke();

  // Draw the progress waveform (played part)
  if (progress > 0) {
    ctx.save();
    ctx.rect(0, 0, width * progress, height);
    ctx.clip();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000'; // black
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.moveTo(i, amp * (1 + min));
      ctx.lineTo(i, amp * (1 + max));
    }
    ctx.stroke();
    ctx.restore();
  }
};



// --- Component Interfaces ---
interface AudioPlayerProps {
  audioUrl: string;
  audioDuration?: number;
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

// --- Main Component ---
const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ audioUrl, audioDuration, mediaId, postId, coverUrl, comments, onTimeUpdate, downloadable }, ref) => {
    const { user } = useSession();
    const { register, unregister, play: notifyControllerPlay } = useMediaControl();

    // console.log("the audioUrl", audioUrl);
    
    const [isLoading, setIsLoading] = useState(false); // Not loading initially. Becomes true only during the first load.
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(audioDuration || 0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [readsCount, setReadsCount] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const playbackTimeRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);

    // Draw placeholder waveform on initial render
    useEffect(() => {
      if (waveformCanvasRef.current && !audioBufferRef.current) {
        drawPlaceholderWaveform(waveformCanvasRef.current);
      }
    }, []);

    // --- Core Audio Functions (Web Audio API) ---
    const play = useCallback((resumeTime: number) => {
      if (!audioContextRef.current || !audioBufferRef.current || !gainNodeRef.current) return;
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(0); } catch (e) {
          console.error("Web Audio API Error:", e);
        }
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(gainNodeRef.current).connect(audioContextRef.current.destination);
      
      const offset = resumeTime % audioBufferRef.current.duration;
      source.start(0, offset);
      
      sourceNodeRef.current = source;
      startTimeRef.current = audioContextRef.current.currentTime;
      playbackTimeRef.current = offset;
      setIsPlaying(true);
      
      source.onended = () => {
        if (sourceNodeRef.current === source) {
          setIsPlaying(false);
          if (audioBufferRef.current && playbackTimeRef.current >= audioBufferRef.current.duration - 0.1) {
            playbackTimeRef.current = 0;
            setCurrentTime(0);
          }
        }
      };
    }, []);

    const pause = useCallback(() => {
      if (!audioContextRef.current || !sourceNodeRef.current) return;
      try {
        sourceNodeRef.current.stop(0);
        const newPlaybackTime = playbackTimeRef.current + (audioContextRef.current.currentTime - startTimeRef.current);
        playbackTimeRef.current = newPlaybackTime;
        setIsPlaying(false);
      } catch (e) {
        setIsPlaying(false);
        console.error("Web Audio API Error:", e);
      }
    }, []);

    const loadAndPlay = useCallback(async () => {
      if (isLoading || !audioUrl || audioBufferRef.current) return;

      setIsLoading(true);
      console.time('TOTAL-LOAD-TIME');

      try {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
          gainNodeRef.current = audioContextRef.current.createGain();
        }
        
        console.time('1-FETCH-AUDIO');
        const response = await fetch(`/api/audio?url=${encodeURIComponent(audioUrl)}`);
        if (!response.ok) throw new Error(`Failed to fetch audio data: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        console.timeEnd('1-FETCH-AUDIO');

        console.time('2-DECODE-AUDIO');
        const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        console.timeEnd('2-DECODE-AUDIO');

        audioBufferRef.current = decodedBuffer;
        setDuration(decodedBuffer.duration);

        if (waveformCanvasRef.current) {
          console.time('3-DRAW-WAVEFORM');
          drawWaveform(waveformCanvasRef.current, decodedBuffer, 0);
          console.timeEnd('3-DRAW-WAVEFORM');
        }
        
        notifyControllerPlay(mediaId);
        play(0);

      } catch (error) {
        console.error("Error loading audio:", error);
      } finally {
        setIsLoading(false);
        console.timeEnd('TOTAL-LOAD-TIME');
      }
    }, [audioUrl, isLoading, play, notifyControllerPlay, mediaId]);

    // --- Effects ---
    useEffect(() => {
      // This effect only handles cleanup when the component unmounts.
      return () => {
        try {
          sourceNodeRef.current?.stop(0);
        } catch (e) {
          console.error("Web Audio API Error:", e);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(console.error);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    useEffect(() => {
      const update = () => {
        if (isPlaying && audioContextRef.current && audioBufferRef.current && waveformCanvasRef.current) {
          const newTime = playbackTimeRef.current + (audioContextRef.current.currentTime - startTimeRef.current);
          setCurrentTime(newTime);
          if (onTimeUpdate) onTimeUpdate(newTime);
          
          const progress = duration > 0 ? newTime / duration : 0;
          drawWaveform(waveformCanvasRef.current, audioBufferRef.current, progress);
          
          animationFrameRef.current = requestAnimationFrame(update);
        }
      };
      
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(update);
      } else {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      }
      
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }, [isPlaying, duration, onTimeUpdate]);

    // --- Feature Logic (Reads, etc.) ---
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

    useEffect(() => { fetchReadsCount(); }, [fetchReadsCount]);
    
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

    useEffect(() => {
      if (currentTime >= 5 && user && mediaId && !hasTrackedThisSession.current) {
        hasTrackedThisSession.current = true;
        handleMarkAsRead();
      }
    }, [currentTime, user, mediaId, handleMarkAsRead]);

    useEffect(() => {
      if (!mediaId) return;
      register(mediaId, pause);
      return () => unregister(mediaId);
    }, [mediaId, register, unregister, pause]);

    // --- Event Handlers ---
    const togglePlayPause = () => {
      if (audioBufferRef.current) {
        if (isPlaying) {
          pause();
        } else {
          notifyControllerPlay(mediaId);
          play(playbackTimeRef.current);
        }
      } else {
        loadAndPlay();
      }
    };

    const handleSeek = (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!waveformCanvasRef.current) return;

      // If audio is not loaded yet, trigger loading instead of seeking.
      if (!audioBufferRef.current) {
        if (!isLoading) {
          loadAndPlay();
        }
        return;
      }
      
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const seekTime = (clickX / canvas.clientWidth) * duration;
      
      setCurrentTime(seekTime);
      playbackTimeRef.current = seekTime;
      
      if (waveformCanvasRef.current && audioBufferRef.current) {
        const progress = duration > 0 ? seekTime / duration : 0;
        drawWaveform(waveformCanvasRef.current, audioBufferRef.current, progress);
      }
      
      if (isPlaying) {
        play(seekTime);
      }
    };
    
    const toggleMute = () => {
      if (!gainNodeRef.current) return;
      const newMuteState = !isMuted;
      gainNodeRef.current.gain.setValueAtTime(newMuteState ? 0 : 1, audioContextRef.current?.currentTime || 0);
      setIsMuted(newMuteState);
    };

    const seekToTime = useCallback((time: number) => {
      if (!audioBufferRef.current || duration === 0) return;
      
      const seekTime = Math.max(0, Math.min(time, duration));
      setCurrentTime(seekTime);
      playbackTimeRef.current = seekTime;
      
      if (waveformCanvasRef.current && audioBufferRef.current) {
        const progress = duration > 0 ? seekTime / duration : 0;
        drawWaveform(waveformCanvasRef.current, audioBufferRef.current, progress);
      }
      
      if (isPlaying) {
        play(seekTime);
      } else {
        notifyControllerPlay(mediaId);
        play(seekTime);
      }
    }, [duration, isPlaying, play, notifyControllerPlay, mediaId]);

    useImperativeHandle(ref, () => ({
      seekToTime: seekToTime
    }));

    // --- Render ---
    return (
      <div className="rounded-[18px] p-4">
        {/* No <audio> tag needed! */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 flex items-center justify-center bg-primary rounded-full hover:bg-primary/90 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-6 h-6"><LoadingAnimation /></div>
              ) : isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 min-w-[30px]">{formatTime(currentTime)}</span>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm text-gray-600 min-w-[40px]">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-2 relative">
              <button onClick={toggleMute} className="text-gray-600 hover:text-gray-800 transition-colors">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-sm text-gray-600">{readsCount} lectures</span>
            </div>
          </div>

          {downloadable && (
            <a href={audioUrl} download className="flex items-center gap-2 rounded-full hover:bg-gray-200 transition-colors text-sm" title="Télécharger l'audio">
              Télécharger
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
            </a>
          )}
        </div>

        <div className="flex gap-4">
          <div className="relative w-24 h-24 flex-shrink-0 bg-black/90 rounded-lg overflow-hidden">
            {coverUrl && !coverUrl.includes('cloudinary.com/video/upload/') && (
              <Image src={coverUrl} alt="Cover" fill className="object-cover" />
            )}
          </div>

          <div className="relative flex-1 h-24 bg-gray-100 rounded-lg overflow-hidden color-black">
            <canvas 
              ref={waveformCanvasRef}
              width="400"
              height="100"
              onClick={handleSeek}
              style={{ cursor: 'pointer', width: '100%', height: '100%', color: 'black' }}
            />
            {duration > 0 && comments.map((comment) => (
              <div key={comment.id} className="absolute group" style={{ left: `${(comment.timestamp / duration) * 100}%`, bottom: 0 }}>
                <div
                  className="w-1 h-4 bg-red-500 transform -translate-x-1/2 cursor-pointer hover:h-6 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    seekToTime(comment.timestamp);
                  }}
                />
                <div className="fixed transform -translate-x-1/2 hidden group-hover:block bg-white rounded-lg shadow-lg p-2 w-48 z-10" style={{ left: `calc(${(comment.timestamp / duration) * 100}% + var(--marker-offset, 0px))`, bottom: 'calc(var(--waveform-bottom, 100px) + 20px)' }} ref={(el) => { if (el) { const parentRect = el.parentElement?.getBoundingClientRect(); if (parentRect) { el.style.setProperty('--marker-offset', `${parentRect.left}px`); el.style.setProperty('--waveform-bottom', `${window.innerHeight - parentRect.bottom}px`); } } }}>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${comment.author.username || ''}`}>
                        <Avatar src={comment.author.avatar_url || null} stageName={comment.author.stage_name || null} size={20} />
                      </Link>
                      <span className="text-sm font-medium">{comment.author.stage_name || comment.author.username}</span>
                    </div>
                    <p className="text-sm text-gray-600">{comment.content.length > 50 ? `${comment.content.substring(0, 50)}...` : comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
