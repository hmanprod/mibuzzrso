"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { Media } from "@/types/database";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { formatTime } from "@/lib/utils";
import { useMediaControl } from "../providers/MediaControlProvider";
import Image from "next/image";
import { Loader2 } from "lucide-react";

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
      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio?.duration || 0);
        setIsLoading(false);
        audio?.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
            setIsLoading(false);
          });
      });

      return () => {
        audio.pause();
        audio.src = "";
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
      console.error("Error playing audio:", error);
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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[var(--purple-600)]/90 to-[var(--pink-500)]/90 text-white shadow-lg z-50">
      {/* Barre de progression */}
      <div className="h-1.5 w-full bg-white/20">
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleSeek}
          className="h-1.5 bg-[var(--purple-600)]"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Image et infos */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 bg-[var(--cream)]/10 rounded overflow-hidden">
            {media.media_cover_url && (
              <div className="relative h-full w-full">
                <Image
                  src={media.media_cover_url}
                  alt={media.title || "Now playing"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold truncate font-poppins text-sm">
              {media.title || "Untitled"}
            </h4>
            <p className="text-xs text-white/75 truncate font-inter">
              {media.author || "Unknown Artist"}
            </p>
          </div>
        </div>

        {/* Contrôles de lecture */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--yellow-400)] hover:text-[var(--yellow-400)]/80 group-hover:scale-105 transition-transform duration-300"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--yellow-400)] hover:text-[var(--yellow-400)]/80 group-hover:scale-105 transition-transform duration-300"
            onClick={togglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--yellow-400)] hover:text-[var(--yellow-400)]/80 group-hover:scale-105 transition-transform duration-300"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 text-xs text-white/80 font-inter">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/50">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume et fermeture */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-[var(--yellow-400)] hover:text-[var(--yellow-400)]/80 group-hover:scale-105 transition-transform duration-300"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20 bg-[var(--purple-600)]"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[var(--yellow-400)] hover:text-[var(--yellow-400)]/80 group-hover:scale-105 transition-transform duration-300"
          >
            <X className="h-4 w-4" />
          </Button>
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