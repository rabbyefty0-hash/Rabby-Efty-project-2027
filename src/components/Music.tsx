import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, Music as MusicIcon, Sparkles, Loader2, ListMusic, Wand2, Upload, X, SkipBack, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllFiles, VFSNode, verifyPermission, addNode } from '../lib/vfs';
import { getMimeType } from '../lib/mime';
import { GoogleGenAI } from '@google/genai';

interface MusicProps {
  onBack: () => void;
}

export function MusicApp({ onBack }: MusicProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'ai'>('library');
  const [audioFiles, setAudioFiles] = useState<VFSNode[]>([]);
  const [currentTrack, setCurrentTrack] = useState<{ url: string, name: string, index: number, source: 'library' | 'ai' } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // AI State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<{ url: string, name: string }[]>([]);
  const [selectedAudioFile, setSelectedAudioFile] = useState<VFSNode | null>(null);

  useEffect(() => {
    loadAudioFiles();
  }, []);

  const loadAudioFiles = async () => {
    const files = await getAllFiles();
    const audio = files.filter(f => {
      const mime = getMimeType(f.name, f.mimeType);
      return mime.startsWith('audio/');
    });
    setAudioFiles(audio);
  };

  const playTrack = (url: string, name: string, index: number, source: 'library' | 'ai') => {
    if (currentTrack?.url === url) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack({ url, name, index, source });
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    }
  };

  const getFileUrl = async (node: VFSNode) => {
    if (node.data instanceof File || node.data instanceof Blob) {
      return URL.createObjectURL(node.data);
    }
    if (node.handle && node.handle.kind === 'file') {
      try {
        const hasPermission = await verifyPermission(node.handle, false);
        if (!hasPermission) {
          alert("Permission to access this file is required.");
          return null;
        }
        const file = await node.handle.getFile();
        return URL.createObjectURL(file);
      } catch (e) {
        console.error("Error reading file", e);
      }
    }
    return null;
  };

  const handlePlayNode = async (node: VFSNode, index: number) => {
    const url = await getFileUrl(node);
    if (url) {
      playTrack(url, node.name, index, 'library');
    }
  };

  const handleNext = async () => {
    if (!currentTrack) return;
    if (currentTrack.source === 'library') {
      if (audioFiles.length === 0) return;
      const nextIndex = (currentTrack.index + 1) % audioFiles.length;
      const node = audioFiles[nextIndex];
      if (node) {
        const url = await getFileUrl(node);
        if (url) playTrack(url, node.name, nextIndex, 'library');
      }
    } else {
      if (generatedTracks.length === 0) return;
      const nextIndex = (currentTrack.index + 1) % generatedTracks.length;
      const track = generatedTracks[nextIndex];
      if (track) playTrack(track.url, track.name, nextIndex, 'ai');
    }
  };

  const handlePrev = async () => {
    if (!currentTrack) return;
    if (currentTrack.source === 'library') {
      if (audioFiles.length === 0) return;
      const prevIndex = (currentTrack.index - 1 + audioFiles.length) % audioFiles.length;
      const node = audioFiles[prevIndex];
      if (node) {
        const url = await getFileUrl(node);
        if (url) playTrack(url, node.name, prevIndex, 'library');
      }
    } else {
      if (generatedTracks.length === 0) return;
      const prevIndex = (currentTrack.index - 1 + generatedTracks.length) % generatedTracks.length;
      const track = generatedTracks[prevIndex];
      if (track) playTrack(track.url, track.name, prevIndex, 'ai');
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateMusic = async () => {
    if (!prompt && !selectedAudioFile) return;
    
    try {
      setIsGenerating(true);
      
      const win = window as any;
      if (win.aistudio && win.aistudio.hasSelectedApiKey) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await win.aistudio.openSelectKey();
        }
      }

      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        alert("API key is missing. Please select an API key.");
        setIsGenerating(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const parts: any[] = [];
      if (prompt) {
        parts.push({ text: prompt });
      } else {
        parts.push({ text: "Enhance this audio and apply creative variations." });
      }

      if (selectedAudioFile) {
        let file: File | null = null;
        if (selectedAudioFile.data instanceof File) {
          file = selectedAudioFile.data;
        } else if (selectedAudioFile.handle && selectedAudioFile.handle.kind === 'file') {
          const hasPermission = await verifyPermission(selectedAudioFile.handle, false);
          if (hasPermission) {
            file = await selectedAudioFile.handle.getFile();
          }
        }

        if (file) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file as File);
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = error => reject(error);
          });
          
          parts.push({
            inlineData: {
              data: base64,
              mimeType: file.type || 'audio/mp3'
            }
          });
        }
      }

      const response = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: { parts },
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (audioBase64) {
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        
        const newTrack = { url: audioUrl, name: prompt.slice(0, 30) + (prompt.length > 30 ? "..." : "") };
        setGeneratedTracks(prev => [newTrack, ...prev]);
        playTrack(audioUrl, newTrack.name, 0, 'ai');
      }
    } catch (error) {
      console.error("Error generating music:", error);
      alert("Failed to generate music. " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-full bg-zinc-950 text-white relative"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        if (info.offset.x > 50 || info.velocity.x > 500) {
          onBack();
        }
      }}
    >
      <div className="flex items-center p-4 pt-12 bg-zinc-900/80 backdrop-blur-xl border-b border-white/10 z-10">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold ml-2">Music</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2 bg-zinc-900/50">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'library' ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          My Library
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'ai' ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          AI Studio
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-40 custom-scrollbar">
        {activeTab === 'library' ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Your Tracks</h2>
              <label className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-medium cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Import Audio
                <input 
                  type="file" 
                  accept="audio/*" 
                  multiple 
                  className="hidden" 
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      for (let i = 0; i < e.target.files.length; i++) {
                        const file = e.target.files[i];
                        const newNode: VFSNode = {
                          id: Math.random().toString(36).substring(2, 15),
                          name: file.name,
                          type: 'file',
                          parentId: null,
                          data: file,
                          mimeType: file.type || 'audio/mpeg',
                          size: file.size,
                          createdAt: Date.now(),
                          modifiedAt: Date.now()
                        };
                        await addNode(newNode);
                      }
                      loadAudioFiles();
                    }
                  }}
                />
              </label>
            </div>
            {audioFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/40">
                <MusicIcon className="w-16 h-16 mb-4 opacity-50" />
                <p>No audio files found.</p>
                <p className="text-sm mt-2 text-center">Upload files in the File Manager app<br/>to see them here.</p>
              </div>
            ) : (
              audioFiles.map((file, idx) => (
                <div 
                  key={file.id}
                  onClick={() => handlePlayNode(file, idx)}
                  className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-500">
                    <MusicIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-white/50">{new Date(file.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white">
                    {currentTrack?.name === file.name && isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-6 rounded-3xl border border-white/10">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                Create & Enhance AI Music
              </h2>
              <p className="text-sm text-white/60 mb-4">
                Describe the music you want to hear, or select an audio file to enhance, apply effects, or create variations.
              </p>
              
              {/* Audio File Selection */}
              <div className="mb-4">
                {selectedAudioFile ? (
                  <div className="flex items-center justify-between bg-black/40 border border-pink-500/30 rounded-xl p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center text-pink-400 shrink-0">
                        <MusicIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium truncate">{selectedAudioFile.name}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedAudioFile(null)}
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const file = audioFiles.find(f => f.id === e.target.value);
                        if (file) setSelectedAudioFile(file);
                        e.target.value = ""; // Reset select
                      }}
                      className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white/80 focus:outline-none focus:border-pink-500/50 cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>Select an audio file to enhance...</option>
                      {audioFiles.map(file => (
                        <option key={file.id} value={file.id}>{file.name}</option>
                      ))}
                    </select>
                    <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                )}
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={selectedAudioFile ? "E.g., Make it sound more cinematic, add heavy bass, or remix it as synthwave..." : "A cinematic orchestral track with a driving beat..."}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none h-24 mb-4 text-sm"
              />
              <button
                onClick={generateMusic}
                disabled={(!prompt && !selectedAudioFile) || isGenerating}
                className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-pink-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    {selectedAudioFile ? 'Enhance Track' : 'Generate Track'}
                  </>
                )}
              </button>
            </div>

            {generatedTracks.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-white/80 mb-3 px-2">Generated Tracks</h3>
                {generatedTracks.map((track, idx) => (
                  <div 
                    key={idx}
                    onClick={() => playTrack(track.url, track.name, idx, 'ai')}
                    className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-xs text-white/50">AI Generated</p>
                    </div>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white">
                      {currentTrack?.url === track.url && isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Player Bar */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-4 pb-safe flex flex-col gap-3 z-20"
          >
            {/* Progress Bar */}
            <div className="flex items-center gap-3 text-xs text-white/50">
              <span className="w-8 text-right">{formatTime(progress)}</span>
              <input 
                type="range" 
                min={0} 
                max={duration || 100} 
                value={progress} 
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
              />
              <span className="w-8">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <MusicIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-semibold truncate text-sm">{currentTrack.name}</p>
                  <p className="text-xs text-white/60 truncate">Now Playing</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <button onClick={handlePrev} className="text-white/70 hover:text-white transition-colors">
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>
                <button 
                  onClick={() => playTrack(currentTrack.url, currentTrack.name, currentTrack.index, currentTrack.source)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
                </button>
                <button onClick={handleNext} className="text-white/70 hover:text-white transition-colors">
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>
              </div>
            </div>
            
            <audio 
              ref={audioRef} 
              onEnded={handleNext}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              className="hidden" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
