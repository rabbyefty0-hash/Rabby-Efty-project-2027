import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume1, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

export function VideoPlayer({ src, poster, autoPlay = false, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [overlayVolume, setOverlayVolume] = useState(1);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartVolumeRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle wheel gesture to adjust volume
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const delta = -e.deltaY;
    const step = 0.05;
    let newVolume = volume + (delta > 0 ? step : -step);
    newVolume = Math.max(0, Math.min(1, newVolume));
    
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setIsMuted(newVolume === 0);
    
    // Show volume indicator overlay
    setOverlayVolume(newVolume);
    setShowVolumeIndicator(true);
    
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeIndicator(false);
    }, 1500);
  };

  // Handle vertical drag gesture to adjust volume (right side of the player)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = e.clientX - rect.left;
    const isRightSide = clickX > rect.width / 2;
    
    dragStartYRef.current = e.clientY;
    dragStartVolumeRef.current = volume;
    hasDraggedRef.current = false;
    
    if (isRightSide) {
      setIsDraggingVolume(true);
      e.preventDefault();
    }
  };

  const handleMouseMoveGlobal = (e: MouseEvent) => {
    if (!isDraggingVolume || !containerRef.current) return;
    
    const deltaY = dragStartYRef.current - e.clientY; // drag up increases volume
    
    if (Math.abs(deltaY) > 5) {
      hasDraggedRef.current = true;
    } else {
      return;
    }
    
    const sensitivity = 200; // pixels to change volume from 0 to 1
    const deltaVolume = deltaY / sensitivity;
    
    let newVolume = dragStartVolumeRef.current + deltaVolume;
    newVolume = Math.max(0, Math.min(1, newVolume));
    
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setIsMuted(newVolume === 0);
    
    // Show indicator
    setOverlayVolume(newVolume);
    setShowVolumeIndicator(true);
    
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeIndicator(false);
    }, 1500);
  };

  const handleMouseUpGlobal = () => {
    setIsDraggingVolume(false);
  };

  // Touch gesture support for mobile devices (right side vertical drag)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const touch = e.touches[0];
    const clickX = touch.clientX - rect.left;
    const isRightSide = clickX > rect.width / 2;
    
    dragStartYRef.current = touch.clientY;
    dragStartVolumeRef.current = volume;
    hasDraggedRef.current = false;
    
    if (isRightSide) {
      setIsDraggingVolume(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingVolume || !containerRef.current) return;
    
    const touch = e.touches[0];
    const deltaY = dragStartYRef.current - touch.clientY;
    
    if (Math.abs(deltaY) > 5) {
      hasDraggedRef.current = true;
    } else {
      return;
    }
    
    const sensitivity = 200;
    const deltaVolume = deltaY / sensitivity;
    
    let newVolume = dragStartVolumeRef.current + deltaVolume;
    newVolume = Math.max(0, Math.min(1, newVolume));
    
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setIsMuted(newVolume === 0);
    
    // Show indicator
    setOverlayVolume(newVolume);
    setShowVolumeIndicator(true);
    
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeIndicator(false);
    }, 1500);

    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsDraggingVolume(false);
  };

  // Bind mouse move and mouse up globally during drag
  useEffect(() => {
    if (isDraggingVolume) {
      window.addEventListener('mousemove', handleMouseMoveGlobal);
      window.addEventListener('mouseup', handleMouseUpGlobal);
    } else {
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [isDraggingVolume, volume]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    };
  }, []);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If we just finished a drag gesture, prevent toggling play/pause
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    togglePlay();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    if (autoPlay) {
      video.play().catch(console.error);
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src, autoPlay]);

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (Number(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      setProgress(Number(e.target.value));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);

      setOverlayVolume(nextMuted ? 0 : volume);
      setShowVolumeIndicator(true);
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
      volumeTimeoutRef.current = setTimeout(() => {
        setShowVolumeIndicator(false);
      }, 1500);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }

    setOverlayVolume(val);
    setShowVolumeIndicator(true);
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeIndicator(false);
    }, 1500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group bg-black overflow-hidden rounded-xl ${className} cursor-ns-resize`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
        setIsDraggingVolume(false);
      }}
      onClick={handleContainerClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain pointer-events-none"
        playsInline
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Volume Gesture Overlay Indicator */}
      {showVolumeIndicator && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md px-5 py-4 rounded-2xl flex flex-col items-center gap-3 pointer-events-none transition-all duration-300 scale-100 opacity-100 shadow-2xl border border-white/10 z-50 min-w-[140px]">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            {isMuted || overlayVolume === 0 ? (
              <VolumeX className="w-6 h-6 text-red-400 animate-pulse" />
            ) : overlayVolume < 0.5 ? (
              <Volume1 className="w-6 h-6 text-indigo-400" />
            ) : (
              <Volume2 className="w-6 h-6 text-indigo-400" />
            )}
          </div>
          <div className="flex flex-col items-center gap-1.5 w-full">
            <span className="text-white text-[10px] font-semibold tracking-wider uppercase text-white/60">Volume</span>
            <span className="text-white text-lg font-bold">
              {isMuted || overlayVolume === 0 ? 'Muted' : `${Math.round(overlayVolume * 100)}%`}
            </span>
          </div>
          <div className="w-28 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-75 rounded-full"
              style={{ width: `${(isMuted ? 0 : overlayVolume) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 z-40 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white text-xs font-medium w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
          <span className="text-white text-xs font-medium w-10">{formatTime(duration)}</span>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors cursor-pointer">
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
            </button>
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:text-indigo-400 transition-colors cursor-pointer">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>
          
          <button onClick={toggleFullscreen} className="text-white hover:text-indigo-400 transition-colors cursor-pointer">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
