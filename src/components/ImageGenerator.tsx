import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Image as ImageIcon, 
  Loader2, 
  Download, 
  AlertCircle, 
  Sparkles, 
  X, 
  Wand2, 
  ArrowLeft, 
  Camera, 
  Palette, 
  Box, 
  Film, 
  Swords,
  Upload,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageEditor } from './ImageEditor';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface ImageGeneratorProps {
  isVpnConnected?: boolean;
  onBack?: () => void;
}

export function ImageGenerator({ onBack }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>(() => {
    const saved = localStorage.getItem('generatedImages');
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [referenceImage, setReferenceImage] = useState<{base64: string, mimeType: string, url: string} | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '3:4' | '4:3'>('1:1');
  const [selectedStyle, setSelectedStyle] = useState('none');
  
  const STYLES = [
    { id: 'none', name: 'Original', icon: Sparkles, color: 'from-blue-400 to-indigo-500' },
    { id: 'photorealistic', name: 'Photo', icon: Camera, color: 'from-amber-400 to-orange-500' },
    { id: 'anime', name: 'Anime', icon: Swords, color: 'from-pink-400 to-rose-500' },
    { id: 'digital-art', name: 'Digital', icon: Palette, color: 'from-emerald-400 to-teal-500' },
    { id: '3d-render', name: '3D Render', icon: Box, color: 'from-cyan-400 to-blue-500' },
    { id: 'cinematic', name: 'Cinematic', icon: Film, color: 'from-slate-600 to-slate-800' },
  ];

  useEffect(() => {
    localStorage.setItem('generatedImages', JSON.stringify(generatedImages));
  }, [generatedImages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        setReferenceImage({
          mimeType: matches[1],
          base64: matches[2],
          url: dataUrl
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError("An empty canvas needs words to come alive.");
      return;
    }

    setIsGenerating(true);
    setError('');
    setStatus('Whispering to the AI...');

    try {
      const customKey = localStorage.getItem('custom_gemini_api_key');
      const apiKey = customKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey) throw new Error("API Key is missing. Please set it in Settings.");

      const ai = new GoogleGenAI({ apiKey });
      
      let finalPrompt = prompt;
      if (selectedStyle !== 'none') {
         const styleName = STYLES.find(s => s.id === selectedStyle)?.name;
         finalPrompt = `${prompt}, ${styleName} aesthetic, masterpiece, highly detailed, professional lighting, 8k`;
      }

      setStatus('Visioning your concept...');
      
      const contentsParts: any[] = [];
      if (referenceImage) {
        contentsParts.push({ inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } });
      }
      contentsParts.push({ text: finalPrompt });

      const response = await ai.models.generateContent({
         model: 'gemini-2.5-flash-image',
         contents: {
           parts: contentsParts
         },
         config: {
           imageConfig: {
             aspectRatio: aspectRatio
           }
         }
      });

      let found = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
             const base64Image = part.inlineData.data;
             const dataUrl = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${base64Image}`;
             setGeneratedImages(prev => [dataUrl, ...prev]);
             found = true;
             
             const fileName = `efty-gen-${Date.now()}.jpg`;
             console.log(`Generated and saved: ${fileName}`);
             break;
          }
        }
      }
      
      if (!found) {
         throw new Error("The AI failed to render your vision. Try refinement.");
      }

    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError(err.message || "Something interrupted the creative spark.");
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  const downloadImage = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `Efty-AI-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-zinc-950 text-white relative h-full w-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 glass-panel border-b border-white/10 z-30">
        <div className="flex items-center gap-3">
          {onBack && (
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={onBack} 
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </motion.button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 ios-icon">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white/90 font-sans">Efty AI Labs</h1>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                <p className="text-[10px] text-indigo-400/80 font-bold uppercase tracking-widest">Image Engine v3</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-32">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Main Control Hub */}
          <div className="glass-card rounded-[3rem] p-8 space-y-8 liquid-glass shadow-2xl border-white/10 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between pl-1">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-white/40" />
                  <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase">The Vision Prompt</label>
                </div>
                {prompt.length > 0 && (
                  <button onClick={() => setPrompt('')} className="text-[10px] font-bold text-indigo-400/80 uppercase hover:text-indigo-300">Clear</button>
                )}
              </div>
              
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What masterpiece should we create today?"
                  className="w-full h-36 bg-black/40 border border-white/10 rounded-[2rem] p-6 pb-12 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition-all duration-300 shadow-inner"
                />
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {referenceImage ? (
                      <div className="relative group/img">
                        <img src={referenceImage.url} alt="Reference" className="w-10 h-10 rounded-xl object-cover border border-white/20" />
                        <button 
                          onClick={() => setReferenceImage(null)}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                        <Upload className="w-4 h-4 text-white/50" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase ml-1">Dimensions</label>
              <div className="flex gap-2 p-1.5 bg-black/40 rounded-3xl border border-white/5">
                {(['1:1', '16:9', '9:16', '3:4', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex-1 py-3 text-[10px] font-bold rounded-2xl transition-all duration-300 ${
                      aspectRatio === ratio 
                        ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                        : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Aesthetic Style</label>
                <span className="text-[10px] font-bold text-indigo-400/80 uppercase">{STYLES.find(s => s.id === selectedStyle)?.name}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar -mx-2 px-2">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-3xl transition-all duration-300 border ${
                      selectedStyle === style.id 
                        ? 'bg-white/10 border-white/30 scale-105 shadow-xl' 
                        : 'bg-black/20 border-white/5'
                    }`}
                    style={{ minWidth: '90px' }}
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${style.color} flex items-center justify-center shadow-lg ios-icon`}>
                      <style.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide ${selectedStyle === style.id ? 'text-white' : 'text-white/40'}`}>
                      {style.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateImage}
                disabled={!prompt.trim() || isGenerating}
                className={`w-full py-6 rounded-[2.5rem] font-bold text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-4 transition-all duration-500 overflow-hidden relative ${
                  !prompt.trim() || isGenerating 
                    ? 'bg-zinc-900 border border-white/5 text-white/10' 
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_20px_50px_rgba(79,70,229,0.4)]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Manifest Vision</span>
                  </>
                )}
                {isGenerating && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 animate-pulse" />
                )}
              </motion.button>
              
              <AnimatePresence>
                {status && (
                  <motion.p 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-[10px] text-indigo-400 font-bold mt-4 tracking-widest uppercase animate-pulse"
                  >
                    {status}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-center gap-4 text-red-200"
            >
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError('')} className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-white/30" />
              </button>
            </motion.div>
          )}

          {/* Results Grid */}
          <AnimatePresence>
            {generatedImages.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8 px-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-baseline">
                    <h2 className="text-xl font-bold tracking-tight text-white/90">Curated Arts</h2>
                    <span className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">{generatedImages.length} Saved</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {generatedImages.map((img, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="group relative glass-card rounded-[3.5rem] overflow-hidden p-3 transition-all duration-700 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]"
                    >
                      <div className="w-full h-full rounded-[3rem] overflow-hidden relative">
                        <img src={img} alt="Creation" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-500 flex items-end p-8">
                           <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 lg:translate-y-6 lg:group-hover:translate-y-0 transition-transform duration-500">
                             <div className="flex flex-col gap-1">
                               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Artifact {generatedImages.length - idx}</p>
                               <p className="text-lg font-bold text-white/90">Efty AI Labs</p>
                             </div>
                             <div className="flex gap-2 flex-wrap">
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setEditingImageIndex(idx)}
                                  className="px-4 py-3 bg-white/10 backdrop-blur-3xl rounded-[1.5rem] border border-white/20 hover:bg-white/20 transition-all font-bold flex items-center gap-2 text-xs"
                                >
                                  <Edit2 className="w-4 h-4 text-white" />
                                  <span className="text-white">Edit</span>
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => downloadImage(img)}
                                  className="px-4 py-3 bg-white/10 backdrop-blur-3xl rounded-[1.5rem] border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2 text-xs"
                                >
                                  <Download className="w-4 h-4 text-white" />
                                  <span className="text-white">Save</span>
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setGeneratedImages(prev => prev.filter((_, i) => i !== idx))}
                                  className="p-3 bg-rose-500/10 backdrop-blur-3xl rounded-[1.5rem] border border-rose-500/20 hover:bg-rose-500/30 transition-all hidden md:block"
                                >
                                  <X className="w-4 h-4 text-rose-300" />
                                </motion.button>
                             </div>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isGenerating && generatedImages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 opacity-20 group">
               <div className="relative">
                 <div className="absolute -inset-8 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all" />
                 <ImageIcon className="w-16 h-16 relative" strokeWidth={1} />
               </div>
               <div className="space-y-4">
                 <p className="text-xs font-black tracking-[0.4em] uppercase text-indigo-400">Void Canvas</p>
                 <p className="text-xs max-w-[240px] leading-relaxed mx-auto font-medium">Capture your thoughts in text to see them materialize in the Lab.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingImageIndex !== null && (
          <ImageEditor
            imageUrl={generatedImages[editingImageIndex]}
            onClose={() => setEditingImageIndex(null)}
            onSave={(dataUrl) => {
               const newImages = [...generatedImages];
               newImages[editingImageIndex] = dataUrl;
               setGeneratedImages(newImages);
               setEditingImageIndex(null);
            }}
            onUseAsReference={(dataUrl) => {
               const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
               if (matches && matches.length === 3) {
                 setReferenceImage({
                   mimeType: matches[1],
                   base64: matches[2],
                   url: dataUrl
                 });
                 setEditingImageIndex(null);
                 window.scrollTo({ top: 0, behavior: 'smooth' });
               }
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

