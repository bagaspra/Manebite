declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    modestbranding?: 0 | 1;
    rel?: 0 | 1;
    start?: number;
    end?: number;
    loop?: 0 | 1;
    fs?: 0 | 1;
  }

  interface PlayerEvent {
    target: Player;
    data: number;
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void;
    onStateChange?: (event: PlayerEvent) => void;
    onError?: (event: PlayerEvent) => void;
  }

  interface PlayerOptions {
    videoId?: string;
    width?: number | string;
    height?: number | string;
    playerVars?: PlayerVars;
    events?: Events;
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): PlayerState;
    getVolume(): number;
    setVolume(volume: number): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    destroy(): void;
  }
}

declare interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady: () => void;
}
