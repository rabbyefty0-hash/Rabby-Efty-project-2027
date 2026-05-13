import React, { useState, useRef } from 'react';
import { Play, Pause, ArrowLeft, Upload, Link as LinkIcon, AlertCircle, Volume2, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaPlayerProps {
  onBack: () => void;
}

export function MediaPlayer({ onBack }: MediaPlayerProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [linkInput, setLinkInput] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(true);
    }
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkInput.trim()) {
      setVideoSrc(linkInput.trim());
      setIsPlaying(true);
    }
  };

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

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(err => {
        console.error("Error attempting fullscreen", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="h-full w-full bg-black flex flex-col relative">
      {!videoSrc ? (
        <div className="flex-1 flex flex-col pt-safe-island px-4">
          <div className="flex items-center gap-4 py-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-white">Media Player</h1>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-8">
            <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center">
              <Play className="w-12 h-12 text-indigo-400 ml-1" />
            </div>
            
            <div className="w-full space-y-4">
              <label className="w-full relative group cursor-pointer">
                <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                <div className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors">
                  <Upload className="w-8 h-8 text-white/60 group-hover:text-white transition-colors" />
                  <div className="text-center">
                    <p className="text-white font-medium">Upload local video</p>
                    <p className="text-white/40 text-sm">MP4, WebM, OGG</p>
                  </div>
                </div>
              </label>

              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative bg-black px-4 text-xs tracking-widest text-white/40 uppercase">or</div>
              </div>

              <form onSubmit={handleLinkSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <LinkIcon className="w-5 h-5 text-white/40" />
                  </div>
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="Paste video URL..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors font-medium">
                  Play
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div 
          ref={containerRef} 
          className="relative w-full h-full bg-black flex items-center justify-center group"
          onMouseMove={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={() => setShowControls(!showControls)}
          />

          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col justify-between pointer-events-none"
              >
                {/* Header */}
                <div className="bg-gradient-to-b from-black/80 to-transparent p-4 pt-safe-island pointer-events-auto">
                  <button 
                    onClick={() => {
                      setVideoSrc(null);
                      if (document.fullscreenElement) document.exitFullscreen();
                    }}
                    className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-colors text-white"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                </div>

                {/* Center controls wrapper (clickable to toggle play) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer" onClick={togglePlay}>
                   {!isPlaying && (
                     <div className="w-20 h-20 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center">
                       <Play className="w-10 h-10 text-white ml-2" />
                     </div>
                   )}
                </div>

                {/* Bottom controls */}
                <div className="bg-gradient-to-t from-black/80 pb-4 pt-12 to-transparent px-4 pointer-events-auto relative z-10 flex items-center justify-between">
                  <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors p-2">
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </button>

                  <button onClick={toggleFullscreen} className="text-white hover:text-indigo-400 transition-colors p-2">
                    {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
