import React, { useState, useRef } from 'react';
import { Play, Pause, ArrowLeft, Upload, Link as LinkIcon, AlertCircle, Volume2, Maximize, Minimize, Settings2, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaPlayerProps {
  onBack: () => void;
}

type MediaType = 'video' | 'youtube' | 'vimeo' | 'gdrive' | 'iframe';

interface ParsedMedia {
  type: MediaType;
  url: string;
}

function parseVideoUrl(url: string): ParsedMedia {
  let urlTrimmed = url.trim();

  // If URL doesn't start with a protocol, and doesn't look like a relative path/blob/data uri, prepend https://
  if (!/^[a-z]+:\/\//i.test(urlTrimmed) && !urlTrimmed.startsWith('data:') && !urlTrimmed.startsWith('blob:')) {
    urlTrimmed = `https://${urlTrimmed}`;
  }

  // 1. YouTube
  const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = urlTrimmed.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
    };
  }

  // 2. Vimeo
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
  const vimeoMatch = urlTrimmed.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'vimeo',
      url: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`
    };
  }

  // 3. Google Drive Video
  const gdriveRegex = /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?\s]+)/;
  const gdriveMatch = urlTrimmed.match(gdriveRegex);
  if (gdriveMatch && gdriveMatch[1]) {
    return {
      type: 'gdrive',
      url: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`
    };
  }

  // 4. Facebook Video Plugin
  if (urlTrimmed.includes('facebook.com') || urlTrimmed.includes('fb.watch')) {
    return {
      type: 'iframe',
      url: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(urlTrimmed)}&show_text=0&autoplay=1`
    };
  }

  // 5. Common video formats direct path
  const directVideoExtensions = /\.(mp4|webm|ogg|mov|m4v|3gp|m3u8)(?:\?|$)/i;
  if (directVideoExtensions.test(urlTrimmed)) {
    return {
      type: 'video',
      url: urlTrimmed
    };
  }

  // 6. Generic Url: can be either direct video or a webpage embed. Let's default to iframe so ANY link works!
  return {
    type: 'iframe',
    url: urlTrimmed
  };
}

export function MediaPlayer({ onBack }: MediaPlayerProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [linkInput, setLinkInput] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setMediaType('video');
      setIsPlaying(true);
    }
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkInput.trim()) {
      const parsed = parseVideoUrl(linkInput.trim());
      setVideoSrc(parsed.url);
      setMediaType(parsed.type);
      setIsPlaying(true);
    }
  };

  const handleDownloadLink = async () => {
    const url = linkInput.trim();
    if (!url) return;

    setIsDownloading(true);
    setDownloadError(null);

    try {
      // Check for Google Drive URL
      const gdriveRegex = /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?\s]+)/;
      const gdriveMatch = url.match(gdriveRegex);
      if (gdriveMatch && gdriveMatch[1]) {
        const docId = gdriveMatch[1];
        const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${docId}`;
        window.open(directDownloadUrl, '_blank', 'noopener,noreferrer');
        setIsDownloading(false);
        return;
      }

      // Check if it's YouTube / Vimeo
      const isYt = /(?:youtube\.com|youtu\.be)/.test(url);
      const isVimeo = /vimeo\.com/.test(url);
      if (isYt || isVimeo) {
        if (isYt) {
          const ssUrl = url.replace(/(?:www\.)?youtube\.com/, 'ssyoutube.com').replace(/youtu\.be\/(.+)/, 'ssyoutube.com/watch?v=$1');
          window.open(ssUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.open(`https://savefrom.net/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
        }
        setIsDownloading(false);
        return;
      }

      // Direct file url download
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('Failed response stream');
      const blob = await res.blob();
      const downloadBlobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadBlobUrl;
      const filename = url.substring(url.lastIndexOf('/') + 1).split('?')[0] || 'direct-download.mp4';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadBlobUrl);
    } catch (err) {
      console.log('Forced blob download blocked by CORS, opening directly for external browser download fallback...');
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', '');
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsDownloading(false);
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

  // Allow manual toggling between Iframe Embed and Native Player for maximum support
  const handleTogglePlayerType = () => {
    if (mediaType === 'video') {
      setMediaType('iframe');
    } else {
      setMediaType('video');
    }
  };

  return (
    <div className="h-full w-full bg-black flex flex-col relative">
      {!videoSrc ? (
        <div className="flex-1 flex flex-col pt-safe-island px-4">
          <div className="flex items-center gap-4 py-4 justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-white">Media Player</h1>
            </div>
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

              <form onSubmit={handleLinkSubmit} className="flex flex-col gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <LinkIcon className="w-5 h-5 text-white/40" />
                  </div>
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="Paste video / YouTube / Drive URL..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl transition-colors font-medium text-center shadow-lg flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Play Video
                  </button>
                  <button 
                    type="button"
                    onClick={handleDownloadLink}
                    disabled={isDownloading}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-white/50 text-white py-3 px-4 rounded-xl transition-colors font-medium text-center shadow-lg flex items-center justify-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download
                      </>
                    )}
                  </button>
                </div>
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
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              autoPlay
              controls={showControls}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={() => setShowControls(!showControls)}
            />
          ) : (
            <iframe
              src={videoSrc}
              title="Media Content"
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          )}

          {/* Floating Controls Overlay */}
          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col justify-between pointer-events-none z-20"
              >
                {/* Header */}
                <div className="bg-gradient-to-b from-black/90 to-transparent p-4 pt-safe-island pointer-events-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setVideoSrc(null);
                        if (document.fullscreenElement) document.exitFullscreen();
                      }}
                      className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-colors text-white"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <span className="text-white font-medium text-sm px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full capitalize">
                      {mediaType} Stream Detected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTogglePlayerType}
                      className="p-2 bg-white/10 hover:bg-indigo-600 backdrop-blur-md rounded-xl transition-colors text-white text-xs font-semibold flex items-center gap-1.5"
                      title="Switch player compatibility mode"
                    >
                      <Settings2 className="w-4 h-4" />
                      {mediaType === 'video' ? 'Switch to Iframe' : 'Switch to Native HTML5'}
                    </button>
                    
                    <button onClick={toggleFullscreen} className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors">
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Left/Right void so user clicks don't interfere with iframe, while keeping back button clickable */}
                <div className="flex-1" />

                {/* Render Play/Pause indicator overlay ONLY for native HTML5 video */}
                {mediaType === 'video' && (
                  <div className="bg-gradient-to-t from-black/90 pb-4 pt-12 to-transparent px-4 pointer-events-auto relative z-10 flex items-center justify-between">
                    <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors p-2">
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

