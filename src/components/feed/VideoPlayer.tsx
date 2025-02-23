'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  comments: {
    id: string;
    timestamp: number;
    content: string;
    position?: { x: number; y: number };
    author: {
      name: string;
      image: string;
    };
  }[];
}

export default function VideoPlayer({ videoUrl, comments }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', () => {
        setDuration(videoRef.current?.duration || 0);
      });
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
                  <img
                    src={comment.author.image}
                    alt={comment.author.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm font-medium">{comment.author.name}</span>
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
              <Maximize className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
