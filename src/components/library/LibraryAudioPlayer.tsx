'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import { Media } from '@/types/database';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { formatTime } from '@/lib/utils';
import { useMediaControl } from '../providers/MediaControlProvider';
import Image from 'next/image';

interface LibraryAudioPlayerProps {
  media: Media | null;
  onClose: () => void;
}

export function LibraryAudioPlayer({ media, onClose }: LibraryAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { register, unregister, play } = useMediaControl();

  useEffect(() => {
    if (!media?.id) return;
    
    const pause = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    register(media.id, pause);
    return () => unregister(media.id);
  }, [media?.id, register, unregister]);

  useEffect(() => {
    const audio = audioRef.current;
    if (media && audio) {
      setIsLoading(true);
      audio.src = media.media_url;
      audio.load();
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio?.duration || 0);
        setIsLoading(false);
        audio?.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
            setIsLoading(false);
          });
      });

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [media]);

  const togglePlay = async () => {
    if (!audioRef.current || !media?.id) return;

    try {
      setIsLoading(true);
      if (isPlaying) {
        await audioRef.current.pause();
        setIsPlaying(false);
      } else {
        play(media.id);
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
      setCurrentTime(audioRef.current.currentTime);
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
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        audioRef.current.volume = 0;
        setVolume(0);
      } else {
        audioRef.current.volume = 1;
        setVolume(1);
      }
    }
  };

  if (!media) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#333333] text-white shadow-lg z-50">
      {/* Barre de progression */}
      <div className="h-1 w-full bg-white/20">
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleSeek}
          className="h-1"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Image et infos */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-12 w-12 bg-[#444444] rounded overflow-hidden">
              {media.media_cover_url && (
                <div className="relative h-full w-full">
                  <Image
                    src={media.media_cover_url}
                    alt={media.title || 'Now playing'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold truncate">{media.title || 'Untitled'}</h4>
              <p className="text-sm text-white/75 truncate">Artist Name</p>
            </div>
          </div>

          {/* Contrôles de lecture */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-white hover:text-[#E94135]">
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-[#E94135]"
                onClick={togglePlay}
                disabled={isLoading}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:text-[#E94135]">
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/50">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume et fermeture */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:text-[#E94135]"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:text-[#E94135]"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
