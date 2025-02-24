'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';

interface AudioPlayerProps {
  audioUrl: string;
  waveformData: number[]; // Données de la forme d'onde
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
}

export default function AudioPlayer({ audioUrl, waveformData, comments }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
    }
  }, []);

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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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

      {/* Forme d'onde */}
      <div
        ref={waveformRef}
        className="h-24 bg-gray-50 rounded-[18px] relative cursor-pointer"
        onClick={handleWaveformClick}
      >
        {/* Rendu de la forme d'onde */}
        <div className="absolute inset-0 flex items-center px-4">
          {waveformData.map((height, index) => (
            <div
              key={index}
              className="flex-1 mx-[1px]"
              style={{ height: `${height}%` }}
            >
              <div
                className={`w-full h-full rounded-sm ${
                  (index / waveformData.length) <= (currentTime / duration)
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Marqueurs de commentaires */}
        {comments.map((comment) => {
          const position = (comment.timestamp / duration) * 100;
          return (
            <div
              key={comment.id}
              className="absolute top-0 w-1 h-full bg-primary opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
              style={{ left: `${position}%` }}
              title={comment.content}
            />
          );
        })}
      </div>

      {/* Zone de commentaires */}
      <div className="space-y-2">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = comment.timestamp;
                setCurrentTime(comment.timestamp);
              }
            }}
          >
            <Image
              src={comment.author.avatar_url || '/images/default-avatar.png'}
              alt={`${comment.author.stage_name}'s avatar`}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author.stage_name}</span>
                <span className="text-xs text-gray-500">
                  {formatTime(comment.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
