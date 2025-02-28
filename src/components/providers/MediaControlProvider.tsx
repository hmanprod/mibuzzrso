'use client';

import React, { createContext, useContext, useRef, useCallback } from 'react';

interface MediaControlContextType {
  register: (id: string, pause: () => void) => void;
  unregister: (id: string) => void;
  play: (id: string) => void;
}

const MediaControlContext = createContext<MediaControlContextType | null>(null);

export function MediaControlProvider({ children }: { children: React.ReactNode }) {
  // Keep track of all media players and their pause functions
  const players = useRef<Map<string, () => void>>(new Map());

  const register = useCallback((id: string, pause: () => void) => {
    players.current.set(id, pause);
  }, []);

  const unregister = useCallback((id: string) => {
    players.current.delete(id);
  }, []);

  const play = useCallback((id: string) => {
    // Pause all other players except the one being played
    players.current.forEach((pauseFn, playerId) => {
      if (playerId !== id) {
        pauseFn();
      }
    });
  }, []);

  return (
    <MediaControlContext.Provider value={{ register, unregister, play }}>
      {children}
    </MediaControlContext.Provider>
  );
}

export function useMediaControl() {
  const context = useContext(MediaControlContext);
  if (!context) {
    throw new Error('useMediaControl must be used within a MediaControlProvider');
  }
  return context;
}
