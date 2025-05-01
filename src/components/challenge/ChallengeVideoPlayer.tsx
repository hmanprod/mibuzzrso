'use client';

import { forwardRef, useRef } from 'react';
import ReactPlayer from 'react-player';

interface ChallengeVideoPlayerProps {
  videoUrl: string;
  onTimeUpdate?: (time: number) => void;
}

interface ChallengeVideoPlayerRef {
  seekToTime: (time: number) => void;
}

const ChallengeVideoPlayer = forwardRef<ChallengeVideoPlayerRef, ChallengeVideoPlayerProps>(
  ({ videoUrl, onTimeUpdate }, ref) => {
    const playerRef = useRef<ReactPlayer>(null);

    // Expose seekToTime method via ref
    if (ref) {
      if (typeof ref === 'function') {
        ref({
          seekToTime: (time: number) => {
            if (playerRef.current) {
              playerRef.current.seekTo(time, 'seconds');
            }
          },
        });
      } else {
        ref.current = {
          seekToTime: (time: number) => {
            if (playerRef.current) {
              playerRef.current.seekTo(time, 'seconds');
            }
          },
        };
      }
    }

    return (
      <div className="aspect-video bg-black">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          controls
          playing={false}
          onProgress={state => onTimeUpdate?.(state.playedSeconds)}
          config={{
            file: {
              attributes: {
                style: { width: '100%', height: '100%', objectFit: 'contain' }
              }
            }
          }}
        />
      </div>
    );
  }
);

ChallengeVideoPlayer.displayName = 'ChallengeVideoPlayer';

export default ChallengeVideoPlayer;
