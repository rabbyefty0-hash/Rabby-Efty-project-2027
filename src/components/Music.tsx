import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, Music as MusicIcon, Sparkles, Loader2, ListMusic, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllFiles, VFSNode, verifyPermission } from '../lib/vfs';
import { getMimeType } from '../lib/mime';
import { GoogleGenAI } from '@google/genai';

interface MusicProps {
  onBack: () => void;
}

export function MusicApp({ onBack }: MusicProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'ai'>('library');
  const [audioFiles, setAudioFiles] = useState<VFSNode[]>([]);
  const [currentTrack, setCurrentTrack] = useState<{ url: string, name: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // AI State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<{ url: string, name: string }[]>([]);

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

  const playTrack = (url: string, name: string) => {
    if (currentTrack?.url === url) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack({ url, name });
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

  const handlePlayNode = async (node: VFSNode) => {
    const url = await getFileUrl(node);
    if (url) {
      playTrack(url, node.name);
    }
  };

  const generateMusic = async () => {
    if (!prompt) return;
    
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
      const response = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: prompt,
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
        playTrack(audioUrl, newTrack.name);
      }
    } catch (error) {
      console.error("Error generating music:", error);
      alert("Failed to generate music. " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white relative">
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

      <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
        {activeTab === 'library' ? (
          <div className="space-y-2">
            {audioFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/40">
                <MusicIcon className="w-16 h-16 mb-4 opacity-50" />
                <p>No audio files found.</p>
                <p className="text-sm mt-2 text-center">Upload files in the File Manager app<br/>to see them here.</p>
              </div>
            ) : (
              audioFiles.map(file => (
                <div 
                  key={file.id}
                  onClick={() => handlePlayNode(file)}
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
                    {currentTrack?.name === file.name && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
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
                Create AI Music
              </h2>
              <p className="text-sm text-white/60 mb-4">
                Describe the music you want to hear. The AI will generate a 30-second clip using Lyria.
              </p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cinematic orchestral track with a driving beat..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none h-32 mb-4"
              />
              <button
                onClick={generateMusic}
                disabled={!prompt || isGenerating}
                className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-pink-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Track
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
                    onClick={() => playTrack(track.url, track.name)}
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
                      {currentTrack?.url === track.url && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
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
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-4 pb-safe"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <MusicIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{currentTrack.name}</p>
                <p className="text-xs text-white/60">Now Playing</p>
              </div>
              <button 
                onClick={() => playTrack(currentTrack.url, currentTrack.name)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
            </div>
            <audio 
              ref={audioRef} 
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
