'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
  autoplay?: boolean;
  className?: string;
}

// YouTube types from @types/youtube
declare global {
  interface Window {
    YT: {
      Player: new (
        element: HTMLElement | string,
        config: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YouTubePlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YouTubePlayerInstance;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  isMuted: () => boolean;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export function YouTubePlayer({
  videoId,
  onProgress,
  onComplete,
  autoplay = false,
  className = '',
}: YouTubePlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [hasReported75, setHasReported75] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = initPlayer;

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const initPlayer = useCallback(() => {
    if (!containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        playsinline: 1,
        rel: 0,
        cc_load_policy: 0,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady: handleReady,
        onStateChange: handleStateChange,
      },
    });
  }, [videoId, autoplay]);

  const handleReady = (event: { target: YouTubePlayerInstance }) => {
    setIsReady(true);
    setDuration(event.target.getDuration());

    // Start progress tracking
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        const totalDuration = playerRef.current.getDuration();
        const percent = (currentTime / totalDuration) * 100;

        setProgress(currentTime);

        if (onProgress) {
          onProgress(percent);
        }

        // Report 75% completion
        if (percent >= 75 && !hasReported75) {
          setHasReported75(true);
          onComplete?.();
        }
      }
    }, 1000);
  };

  const handleStateChange = (event: { data: number }) => {
    setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted || volume === 0) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume > 0 ? volume : 100);
      setIsMuted(false);
      if (volume === 0) setVolume(100);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return;

    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    playerRef.current.setVolume(newVolume);

    if (newVolume === 0) {
      playerRef.current.mute();
      setIsMuted(true);
    } else if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="h-5 w-5" />;
    if (volume < 50) return <Volume1 className="h-5 w-5" />;
    return <Volume2 className="h-5 w-5" />;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    playerRef.current.seekTo(percent * duration, true);
  };

  const handleFullscreen = () => {
    if (!wrapperRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative bg-black overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* YouTube Player Container — scaled to crop branding from edges */}
      <div className="aspect-video relative overflow-hidden">
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            transform: 'translate(-50%, -50%) scale(1.08)',
          }}
        >
          <div ref={containerRef} className="w-full h-full" />
        </div>
        {/* Top gradient mask — hides title bar */}
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: '60px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)',
          }}
        />
        {/* Bottom-right mask — hides YouTube logo watermark */}
        <div
          className="absolute bottom-0 right-0 z-10 pointer-events-none"
          style={{
            width: '120px',
            height: '36px',
            background: 'linear-gradient(to left, rgba(0,0,0,0.9) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* Clickable overlay for play/pause - covers entire video */}
      <div
        className="absolute inset-0 cursor-pointer z-20"
        onClick={togglePlay}
      />

      {/* Custom Controls Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none z-30 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Gradient overlay for better control visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Center play button */}
        {!isPlaying && isReady && (
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full bg-[#9B5DE5] border-4 border-white shadow-lg flex items-center justify-center hover:bg-[#8B4DD5] transition-colors pointer-events-auto"
          >
            <Play className="h-10 w-10 text-white ml-1" fill="white" />
          </button>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto bg-gradient-to-t from-black/90 to-transparent">
          {/* Progress bar */}
          <div
            className="h-2 bg-white/30 rounded-full cursor-pointer mb-4 group/progress hover:h-3 transition-all"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-[#9B5DE5] rounded-full relative transition-all"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>

              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMute}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
                >
                  {getVolumeIcon()}
                </button>

                {/* Volume Slider */}
                <div
                  className={`absolute left-full ml-2 flex items-center bg-black/80 rounded-lg px-3 py-2 border border-white/20 transition-all ${
                    showVolumeSlider ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}
                >
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-3
                      [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-white
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-3
                      [&::-moz-range-thumb]:h-3
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-white
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <span className="ml-2 text-xs font-medium w-8">
                    {isMuted ? 0 : volume}%
                  </span>
                </div>
              </div>

              <span className="text-sm font-medium ml-2">
                {formatTime(progress)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleFullscreen}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-40">
          <div className="h-12 w-12 border-4 border-[#9B5DE5] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
