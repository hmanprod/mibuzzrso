'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { LoadingAnimation } from '../ui/LoadingAnimation';
import { formatTime } from '@/lib/utils';
import { useMediaControl } from '../providers/MediaControlProvider';

interface ChallengeAudioPlayerProps {
  audioUrl: string;
  onTimeUpdate?: (time: number) => void;
}

interface ChallengeAudioPlayerRef {
  seekToTime: (time: number) => void;
}

const ChallengeAudioPlayer = forwardRef<ChallengeAudioPlayerRef, ChallengeAudioPlayerProps>(
  ({ audioUrl, onTimeUpdate }, ref) => {
    const { register, unregister, play } = useMediaControl();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const processedAudioUrlRef = useRef<string>(audioUrl);

    useEffect(() => {
      if (audioRef.current) {
        const handleLoadedMetadata = () => {
          setDuration(audioRef.current?.duration || 0);
          setError(null);
        };

        const handleError = (e: Event) => {
          const audio = e.target as HTMLAudioElement;
          console.error('Audio error:', audio.error);
          setError('Format audio non supporté');
          setIsLoading(false);
        };

        audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.addEventListener('error', handleError);

        // Convertir en WAV si ce n'est pas déjà le cas
        if (!/\.wav$/i.test(audioUrl)) {
          processedAudioUrlRef.current = audioUrl.replace('.mp3', '.wav');
        } else {
          processedAudioUrlRef.current = audioUrl;
        }

        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audioRef.current.removeEventListener('error', handleError);
          }
        };
      }
    }, [audioRef, audioUrl]);

    // Register this player with the media controller
    useEffect(() => {
      const mediaId = audioUrl;
      const pause = () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      };

      register(mediaId, pause);
      return () => unregister(mediaId);
    }, [audioUrl, register, unregister]);

    const togglePlay = async () => {
      if (!audioRef.current) return;

      try {
        setIsLoading(true);
        setError(null);
        
        if (isPlaying) {
          await audioRef.current.pause();
          setIsPlaying(false);
        } else {
          play(audioUrl);
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        setError('Erreur de lecture audio');
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

    const toggleMute = () => {
      if (audioRef.current) {
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    };

    useImperativeHandle(ref, () => ({
      seekToTime: (time: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = time;
          setCurrentTime(time);
          if (!isPlaying) {
            audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(error => {
                console.error('Error playing audio:', error);
                setError('Erreur de lecture audio');
              });
          }
        }
      }
    }));

    return (
      <div className="bg-white rounded-[18px] p-4">
        <audio
          ref={audioRef}
          src={processedAudioUrlRef.current}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />

        {error && (
          <div className="text-red-500 text-sm mb-2">{error}</div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-[#E94135] hover:bg-[#E63F3F] rounded-full transition-colors"
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
            <span className="text-sm text-gray-600 min-w-[40px]">
              {formatTime(currentTime)}
            </span>
            <span className="text-sm text-gray-400">/</span>
            <span className="text-sm text-gray-600 min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={toggleMute}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </button>
        </div>

        <div 
          className="relative h-1 mt-4 bg-gray-200 rounded overflow-hidden"
        >
          <div 
            className="absolute top-0 bottom-0 left-0 bg-[#E94135]"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </div>
    );
  }
);

ChallengeAudioPlayer.displayName = 'ChallengeAudioPlayer';

export default ChallengeAudioPlayer;
