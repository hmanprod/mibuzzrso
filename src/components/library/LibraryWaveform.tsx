'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface LibraryWaveformProps {
  audioUrl: string;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export function LibraryWaveform({ audioUrl, isPlaying, onPlayPause }: LibraryWaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Cleanup previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    // Create new wavesurfer instance
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(153, 153, 153, 0.4)',
      progressColor: '#E94135',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 1,
      height: 32,
      barRadius: 3,
      normalize: true,
      backend: 'WebAudio',
      hideScrollbar: true,
      interact: true,
      minPxPerSec: 1,
      fillParent: true
    });

    // Load audio
    setIsLoading(true);
    try {
      wavesurferRef.current.load(audioUrl);
      wavesurferRef.current.on('ready', () => {
        setIsLoading(false);
      });
      wavesurferRef.current.on('error', (error) => {
        console.error('Error loading waveform:', error);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error initializing waveform:', error);
      setIsLoading(false);
    }

    // Add event listeners
    wavesurferRef.current.on('interaction', () => {
      if (!isLoading) {
        onPlayPause();
      }
    });

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [audioUrl, isLoading, onPlayPause]);

  useEffect(() => {
    if (!wavesurferRef.current || isLoading) return;

    if (isPlaying) {
      wavesurferRef.current.play();
    } else {
      wavesurferRef.current.pause();
    }
  }, [isPlaying, isLoading]);

  return (
    <div className="relative w-full h-8">
      <div ref={waveformRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="w-4 h-4 border-2 border-[#E94135] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
