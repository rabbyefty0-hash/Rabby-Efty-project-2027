import React, { useState } from 'react';
import { Download, Link as LinkIcon, Film, Loader2, CheckCircle2, AlertCircle, PlayCircle, Music, ShieldCheck, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addNode, generateId } from '../lib/vfs';

interface VideoDownloaderProps {
  isVpnConnected?: boolean;
  onBack?: () => void;
}

export function VideoDownloader({ isVpnConnected, onBack }: VideoDownloaderProps) {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const lowerUrl = url.toLowerCase();
      let source = 'Web Content';
      if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) source = 'YouTube';
      else if (lowerUrl.includes('tiktok.com')) source = 'TikTok';
      else if (lowerUrl.includes('instagram.com')) source = 'Instagram';
      else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) source = 'X (Twitter)';
      else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com')) source = 'Facebook';
      else if (lowerUrl.includes('vimeo.com')) source = 'Vimeo';
      else if (lowerUrl.includes('dailymotion.com')) source = 'Dailymotion';
      else if (lowerUrl.includes('soundcloud.com')) source = 'SoundCloud';

      // We don't fetch the actual download link until the user selects the format,
      // because Cobalt API generates the link on the fly and it might expire.
      // We just show the available options for the detected platform.
      
      let thumbnail = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80";

      const formats = [
        { id: 'mp4-max', quality: 'Max Quality (1080p+)', size: 'Auto', type: 'MP4', icon: <Film className="w-4 h-4" />, isAudio: false },
        { id: 'mp4-720', quality: 'Standard Quality (720p)', size: 'Auto', type: 'MP4', icon: <Film className="w-4 h-4" />, isAudio: false },
        { id: 'mp3-320', quality: 'High Quality Audio (320kbps)', size: 'Auto', type: 'MP3', icon: <Music className="w-4 h-4" />, isAudio: true }
      ];

      setResult({
        title: `Ready to download from ${source}`,
        thumbnail: thumbnail,
        duration: "Ready",
        source: source,
        formats: formats
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = async (format: any) => {
    setDownloadingFormat(format.id);
    setError('');

    try {
      const payload: any = {
        url: url.trim(),
        filenamePattern: 'classic'
      };

      if (format.isAudio) {
        payload.isAudioOnly = true;
        payload.aFormat = 'mp3';
      } else {
        payload.vQuality = format.id === 'mp4-max' ? 'max' : '720';
      }

      const response = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to generate download link. The service might be temporarily unavailable.');
      }

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.text || 'Error generating download link.');
      }

      let downloadUrl = data.url;
      
      // If it's a picker (multiple items like a gallery), just grab the first video/audio
      if (data.status === 'picker' && data.picker && data.picker.length > 0) {
        downloadUrl = data.picker[0].url;
      }

      if (downloadUrl) {
        try {
          // Try to fetch the file to save to VFS
          const fileResponse = await fetch(downloadUrl);
          if (!fileResponse.ok) throw new Error('Network response was not ok');
          const blob = await fileResponse.blob();
          
          // Save to VFS
          const filename = `download_${Date.now()}.${format.type.toLowerCase()}`;
          await addNode({
            id: generateId(),
            name: filename,
            type: 'file',
            data: blob,
            parentId: 'root',
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            size: blob.size,
            mimeType: blob.type || (format.isAudio ? 'audio/mp3' : 'video/mp4')
          });

          // Trigger local download using the blob
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        } catch (fetchErr) {
          console.warn("Could not fetch blob for VFS, falling back to direct download link", fetchErr);
          // Fallback to direct download link if CORS prevents fetching
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.target = '_blank';
          a.download = `download_${Date.now()}.${format.type.toLowerCase()}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else {
        throw new Error('No download URL returned from the server.');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to download. Please try again.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div 
      className="flex-1 overflow-y-auto p-6 lg:p-12 pt-14 pb-24 relative z-10 flex flex-col items-center"
      style={{ touchAction: 'pan-y' }}
    >
      <div 
        className="absolute inset-y-0 left-0 w-4 z-50"
        onPointerDown={(e) => {
          const startX = e.clientX;
          const handlePointerUp = (upEvent: PointerEvent) => {
            if (upEvent.clientX - startX > 50) {
              if (onBack) onBack();
            }
            window.removeEventListener('pointerup', handlePointerUp);
          };
          window.addEventListener('pointerup', handlePointerUp);
        }}
      />
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 glass-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Download className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">꧁Rᴀʙʙʏ Eғᴛʏ꧂ Downloader</h1>
          <p className="text-white/60">Download videos (MP4) and high-quality audio (MP3 320K) directly to your device storage.</p>
        </div>

        <div className={`glass-card p-2 rounded-full border shadow-lg transition-all duration-500 ${isVpnConnected ? 'border-green-500/30 ring-1 ring-green-500/20' : 'border-white/10'}`}>
          <form onSubmit={handleAnalyze} className="flex space-x-2">
            <div className="flex-1 flex items-center pl-4">
              {isVpnConnected ? (
                <ShieldCheck className="w-5 h-5 text-green-400 mr-3" />
              ) : (
                <LinkIcon className="w-5 h-5 text-white/40 mr-3" />
              )}
              <input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={isVpnConnected ? "Securely paste video URL..." : "Paste video URL for ꧁Rᴀʙʙʏ Eғᴛʏ꧂..."}
                disabled={isAnalyzing}
                className="w-full bg-transparent text-white placeholder:text-white/40 outline-none"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={!url.trim() || isAnalyzing}
              className="h-12 px-8 rounded-full shadow-sm bg-indigo-500 hover:bg-indigo-600 text-white border-none shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Download'
              )}
            </button>
          </form>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-2xl flex items-center space-x-3 backdrop-blur-md"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card rounded-3xl border border-white/10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex flex-col md:flex-row gap-6">
                <div className="relative w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                  <img src={result.thumbnail} alt="Thumbnail" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="w-10 h-10 text-white/80" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-medium text-white">
                    {result.duration}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/10 text-xs font-medium text-white/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{result.source}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white line-clamp-2">{result.title}</h3>
                  <p className="text-sm text-white/50">Select a format below to save directly to your device.</p>
                </div>
              </div>
              <div className="p-6 bg-black/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.formats.map((format: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleDownload(format)}
                      disabled={downloadingFormat !== null}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center space-x-3 text-white/90">
                        <div className="p-2 bg-white/10 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                          {format.icon}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{format.quality}</p>
                          <p className="text-xs text-white/50">{format.type} • Direct Save</p>
                        </div>
                      </div>
                      {downloadingFormat === format.id ? (
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      ) : (
                        <HardDrive className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
