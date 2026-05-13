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
  Edit2,
  Zap,
  SlidersHorizontal,
  MessageSquare,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageEditor } from './ImageEditor';
import { cn } from '@/src/lib/utils';
import { addNode, generateId } from '../lib/vfs';

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
    try {
      const saved = localStorage.getItem('generatedImages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [referenceImage, setReferenceImage] = useState<{base64: string, mimeType: string, url: string} | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '3:4' | '4:3'>('1:1');
  const [selectedStyle, setSelectedStyle] = useState('none');
  
  const [downloadDialog, setDownloadDialog] = useState<{ isOpen: boolean, imageIndex: number | null }>({ isOpen: false, imageIndex: null });
  const [downloadOptions, setDownloadOptions] = useState<{ filename: string, format: string }>({ filename: 'Efty-AI-Creation', format: 'image/jpeg' });
  
  const STYLES = [
    { id: 'none', name: 'Original', icon: Sparkles, color: 'from-blue-400 to-indigo-500' },
    { id: 'photorealistic', name: 'Photo', icon: Camera, color: 'from-amber-400 to-orange-500' },
    { id: 'anime', name: 'Anime', icon: Swords, color: 'from-pink-400 to-rose-500' },
    { id: 'digital-art', name: 'Digital', icon: Palette, color: 'from-emerald-400 to-teal-500' },
    { id: '3d-render', name: '3D Render', icon: Box, color: 'from-cyan-400 to-blue-500' },
    { id: 'cinematic', name: 'Cinematic', icon: Film, color: 'from-slate-600 to-slate-800' },
  ];

  useEffect(() => {
    try {
      localStorage.setItem('generatedImages', JSON.stringify(generatedImages));
    } catch (e) {
      console.warn('Storage quota exceeded');
      try {
         localStorage.setItem('generatedImages', JSON.stringify(generatedImages.slice(0, 3)));
      } catch (e2) {
         try {
           localStorage.setItem('generatedImages', JSON.stringify(generatedImages.slice(0, 1)));
         } catch {
           console.error('Failed to save any images to local storage');
         }
      }
    }
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
      
      if (referenceImage) {
        const contentsParts: any[] = [
           { inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } },
           { text: finalPrompt }
        ];

        try {
          const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash-image',
             contents: { parts: contentsParts },
             config: {
               imageConfig: { aspectRatio: aspectRatio }
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
                 console.log(`Generated and saved image.`);
                 break;
              }
            }
          }
          if (!found) throw new Error("The AI failed to render your vision. Try refinement.");
        } catch (imgError: any) {
           if (imgError.message?.includes('permission denied') || imgError.message?.includes('403') || imgError.status === 403 || String(imgError).includes('403')) {
              throw new Error('Image editing requires a paid Gemini key. Please remove the reference image to use the free generation, or add a paid API Key.');
           }
           throw imgError;
        }
      } else {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { text: finalPrompt }
            ]
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio,
            }
          }
        });
        
        let found = false;
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            // Find the image part, do not assume it is the first part.
            if (part.inlineData) {
              const base64Image = part.inlineData.data;
              const dataUrl = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${base64Image}`;
              setGeneratedImages(prev => [dataUrl, ...prev]);
              console.log(`Generated and saved image.`);
              found = true;
              break;
            }
          }
        }
        
        if (!found) {
          throw new Error("The AI failed to render your vision. Try refinement.");
        }
      }

    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError(err.message || "Something interrupted the creative spark.");
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  const handleAiEdit = async () => {
    if (!referenceImage) {
      setError("Please capture or select an image to edit.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please describe how you want to edit the image.");
      return;
    }

    setIsGenerating(true);
    setError('');
    setStatus('Applying AI Edit...');

    try {
      const customKey = localStorage.getItem('custom_gemini_api_key');
      const apiKey = customKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey) throw new Error("API Key is missing. Please set it in Settings.");

      const ai = new GoogleGenAI({ apiKey });
      
      let finalPrompt = prompt;
      if (selectedStyle !== 'none') {
         const styleName = STYLES.find(s => s.id === selectedStyle)?.name;
         finalPrompt = `${prompt}, ${styleName} aesthetic`;
      }

      const contentsParts: any[] = [
         { inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } },
         { text: `Edit this image based on the following instructions: ${finalPrompt}. Provide ONLY the edited image, no text.` }
      ];

      const response = await ai.models.generateContent({
         model: 'gemini-2.5-flash-image',
         contents: { parts: contentsParts },
         config: {}
      });

      let found = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
             const base64Image = part.inlineData.data;
             const dataUrl = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${base64Image}`;
             setGeneratedImages(prev => [dataUrl, ...prev]);
             found = true;
             console.log(`Generated and saved edited image.`);
             break;
          }
        }
      }
      if (!found) throw new Error("The AI failed to edit your image. Try refinement.");
    } catch (imgError: any) {
       console.error("Image editing error", imgError);
       setError(imgError.message || "Failed to edit image.");
    } finally {
       setIsGenerating(false);
       setStatus('');
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = () => {
    if (downloadDialog.imageIndex === null) return;
    const imgUrl = generatedImages[downloadDialog.imageIndex];
    if (!imgUrl) return;

    if (downloadOptions.format !== 'image/jpeg') {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const extension = downloadOptions.format === 'image/webp' ? 'webp' : 'png';
          const newDataUrl = canvas.toDataURL(downloadOptions.format);
          triggerDownload(newDataUrl, `${downloadOptions.filename || 'Efty-AI-Creation'}.${extension}`);
        }
      };
      img.src = imgUrl;
    } else {
      triggerDownload(imgUrl, `${downloadOptions.filename || 'Efty-AI-Creation'}.jpg`);
    }
    setDownloadDialog({ isOpen: false, imageIndex: null });
  };

  const handleSaveToGallery = async (dataUrl: string) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      const fileId = generateId();
      await addNode({
        id: fileId,
        name: `AI_Generated_${Date.now()}.jpg`,
        type: 'file',
        parentId: null, // Save to root or a specific folder if mapped
        data: blob,
        mimeType: 'image/jpeg',
        size: blob.size,
        createdAt: Date.now(),
        modifiedAt: Date.now()
      });
      setStatus('Saved to Gallery!');
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      console.error("Failed to save to gallery", e);
      setError("Failed to save to gallery.");
    }
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
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 ios-icon hidden sm:flex">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white/90 font-sans">ৡRABBY EFTYৡ Image</h1>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                <p className="text-[10px] text-indigo-400/80 font-bold uppercase tracking-widest">Image Engine v3</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-32">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Main Control Hub */}
          <div className="flex flex-col items-center justify-center pt-8 pb-2 space-y-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
              <div className="w-24 h-24 bg-gradient-to-b from-[#222] to-[#111] rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl relative z-10 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <ImageIcon className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)] group-hover:scale-110 transition-transform duration-500" />
              </div>
            </motion.div>
            <p className="text-[15px] text-center text-white/60 max-w-sm font-medium leading-relaxed tracking-wide">
              Describe what you want to see, or upload an image to edit and enhance it.
            </p>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#151515] rounded-[2.5rem] p-5 space-y-4 border border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative mx-auto max-w-[420px] w-full"
          >
            {referenceImage && (
              <div className="bg-[#222] p-2 rounded-2xl flex items-center justify-between border border-white/5">
                <img src={referenceImage.url} alt="Reference" className="w-12 h-12 rounded-[0.8rem] object-cover border border-white/20" />
                <button 
                  onClick={() => setReferenceImage(null)}
                  className="p-2.5 hover:bg-rose-500/20 text-rose-500 rounded-[0.8rem] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <label className="w-[3.75rem] h-[3.75rem] shrink-0 bg-[#222] hover:bg-[#2a2a2a] transition-colors rounded-[1.25rem] flex items-center justify-center cursor-pointer border border-white/5 shadow-inner group">
                <Upload className="w-5 h-5 text-white/70 group-hover:text-indigo-400 group-hover:-translate-y-0.5 transition-all" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              
              <div className="flex-1 relative group">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask ৡRABBY EFTYৡ"
                  className="w-full bg-[#222] border border-white/5 rounded-[1.25rem] h-[3.75rem] px-5 text-[15px] text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-[#2a2a2a] shadow-inner transition-colors pr-12"
                />
              </div>
              
              <button 
                onClick={() => {
                  const prompts = [
                    "A cyberpunk city in the rain, neon lights reflections", 
                    "A majestic lion with glowing quantum fur",
                    "A cinematic portrait of a futuristic samurai",
                    "An ancient temple hidden in a bioluminescent jungle",
                    "A solitary astronaut exploring a crystalline alien landscape"
                  ];
                  setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
                }}
                className="w-[3.75rem] h-[3.75rem] shrink-0 bg-[#222] hover:bg-[#2a2a2a] hover:border-amber-500/30 transition-all rounded-[1.25rem] flex items-center justify-center border border-white/5 text-amber-400 shadow-inner group"
                title="Surprise me with a prompt"
              >
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Aesthetic Style</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 px-1">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[0.8rem] text-xs font-medium whitespace-nowrap transition-all border ${
                      selectedStyle === style.id 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                        : 'bg-[#222] text-white/50 border-white/5 hover:bg-[#2a2a2a] hover:text-white/80'
                    }`}
                  >
                    <style.icon className="w-3.5 h-3.5" />
                    {style.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between px-1 mt-1">
                <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Aspect Ratio</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 px-1">
                {(['1:1', '16:9', '9:16', '3:4', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-4 py-1.5 rounded-[0.8rem] text-xs font-bold whitespace-nowrap transition-all border ${
                      aspectRatio === ratio
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                        : 'bg-[#222] text-white/50 border-white/5 hover:bg-[#2a2a2a] hover:text-white/80'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {referenceImage ? (
                <>
                  <button 
                    onClick={handleAiEdit}
                    disabled={!prompt.trim() || isGenerating}
                    className={`flex-1 h-[3.75rem] rounded-[1.25rem] font-bold tracking-wide flex items-center justify-center transition-all duration-300 ${
                      !prompt.trim() || isGenerating ? 'bg-[#222] text-white/30 border border-white/5' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-purple-500/50'
                    }`}
                  >
                     {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : "AI Edit"}
                  </button>
                  <button 
                    onClick={generateImage}
                    disabled={!prompt.trim() || isGenerating}
                    className={`flex-1 h-[3.75rem] rounded-[1.25rem] font-bold tracking-wide flex items-center justify-center transition-all duration-300 ${
                      !prompt.trim() || isGenerating ? 'bg-[#222] text-white/30 border border-white/5' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-500/50'
                    }`}
                  >
                     {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate"}
                  </button>
                </>
              ) : (
                <button 
                  onClick={generateImage}
                  disabled={!prompt.trim() || isGenerating}
                  className={`w-full h-[3.75rem] rounded-[1.25rem] font-bold text-[16px] tracking-wide flex items-center justify-center transition-all duration-300 overflow-hidden relative group ${
                    !prompt.trim() || isGenerating ? 'bg-[#222] text-white/30 border border-white/5' : 'text-white'
                  }`}
                >
                  {(!prompt.trim() || isGenerating) ? null : (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#4f46e5] bg-[length:200%_auto] animate-gradient hover:bg-[length:100%_auto] transition-all" />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate"}
                  </span>
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {status && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center text-[12px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse mt-2"
                >
                  {status}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="flex justify-center pt-2">
            <button 
              onClick={() => {
                const prompts = [
                  "A cyberpunk city in the rain, neon lights reflections", 
                  "A majestic lion with glowing quantum fur",
                  "A cinematic portrait of a futuristic samurai",
                  "An ancient temple hidden in a bioluminescent jungle"
                ];
                setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[#111] hover:bg-[#1a1a1a] rounded-[1.25rem] border border-white/10 text-white/80 text-[14px] font-medium transition-all shadow-lg hover:shadow-indigo-500/10 group"
            >
              <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              Surprise Me
            </button>
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
                                  onClick={() => setDownloadDialog({ isOpen: true, imageIndex: idx })}
                                  className="px-4 py-3 bg-white/10 backdrop-blur-3xl rounded-[1.5rem] border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2 text-xs"
                                >
                                  <Download className="w-4 h-4 text-white" />
                                  <span className="text-white">Save</span>
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleSaveToGallery(img)}
                                  className="px-4 py-3 bg-white/10 backdrop-blur-3xl rounded-[1.5rem] border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2 text-xs"
                                  title="Add to Gallery"
                                >
                                  <ImageIcon className="w-4 h-4 text-white" />
                                  <span className="text-white">Gallery</span>
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
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 opacity-0">
               {/* Hidden state to keep layout structure */}
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 left-6 z-40 pointer-events-auto">
        <button className="w-14 h-14 bg-indigo-500 rounded-[1.2rem] rounded-bl-[0.5rem] flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white hover:bg-indigo-400 transition-colors">
          <MessageSquare className="w-6 h-6 fill-current" />
        </button>
      </div>

      <div className="absolute bottom-6 right-6 z-40 pointer-events-auto">
        <button className="w-14 h-14 bg-[#8B5CF6] rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20 text-white hover:bg-purple-400 transition-colors">
          <Mic className="w-6 h-6" />
        </button>
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
            onUseAsReference={(dataUrl, customPrompt) => {
               const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
               if (matches && matches.length === 3) {
                 setReferenceImage({
                   mimeType: matches[1],
                   base64: matches[2],
                   url: dataUrl
                 });
                 if (customPrompt) {
                   setPrompt(customPrompt);
                 }
                 setEditingImageIndex(null);
                 window.scrollTo({ top: 0, behavior: 'smooth' });
               }
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {downloadDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setDownloadDialog({ isOpen: false, imageIndex: null })}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-white/50 hover:text-white transition-colors" />
              </button>

              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-white/90">Save Image</h3>
                <p className="text-sm text-white/50">Specify filename and format.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold ml-1">Filename</label>
                  <input
                    type="text"
                    value={downloadOptions.filename}
                    onChange={(e) => setDownloadOptions(prev => ({ ...prev, filename: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold ml-1">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['image/jpeg', 'image/png', 'image/webp'].map((format) => (
                      <button
                        key={format}
                        onClick={() => setDownloadOptions(prev => ({ ...prev, format }))}
                        className={cn(
                          "px-3 py-2 text-xs rounded-xl font-medium transition-all border",
                          downloadOptions.format === format 
                            ? "bg-indigo-500 text-white border-indigo-400" 
                            : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {format.split('/')[1].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold tracking-widest uppercase transition-colors shadow-lg shadow-indigo-500/25 mt-4"
                >
                  Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

