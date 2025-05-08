import { useState, useRef, useEffect } from 'react';
import { PlayCircle, PauseCircle, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Media } from '@/types/database';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import Image from 'next/image';

interface PlayerProps {
  media: Media | null;
}

export function Player({ media }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (media && audioRef.current) {
      const audio = audioRef.current;
      audio.src = media.media_url;
      audio.load();
      setIsPlaying(true);
      audio.play().catch(error => {
        console.error('Erreur de lecture:', error);
        setIsPlaying(false);
      });

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [media]);

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
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!media) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#333333] text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        {/* Image et infos */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative w-12 h-12">
            <Image
              src={media.media_cover_url || ''}
              alt={media.title || 'Now playing'}
              fill
              className="object-cover rounded"
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold truncate">{media.title || 'Untitled'}</h4>
            <p className="text-sm text-white/75 truncate">Artist Name</p>
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex flex-col items-center gap-2 flex-[2]">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:text-[#E94135]">
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-[#E94135]"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <PauseCircle className="h-8 w-8" />
              ) : (
                <PlayCircle className="h-8 w-8" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:text-[#E94135]">
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full">
            <span className="text-xs w-12 text-center">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs w-12 text-center">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 w-32">
          <Volume2 className="h-5 w-5" />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
          />
        </div>

        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
}
