declare module 'react-player' {
  import { Component } from 'react';

  interface ReactPlayerProps {
    url: string;
    playing?: boolean;
    controls?: boolean;
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
    onProgress?: (state: { playedSeconds: number }) => void;
    onDuration?: (duration: number) => void;
    config?: {
      file?: {
        attributes?: {
          style?: React.CSSProperties;
        };
      };
    };
  }

  class ReactPlayer extends Component<ReactPlayerProps> {
    seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
  }

  export default ReactPlayer;
}
