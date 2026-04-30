import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion } from 'motion/react';
import { X, Check, SlidersHorizontal, Crop as CropIcon, Wand2, Download } from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (editedDataUrl: string) => void;
  onUseAsReference: (dataUrl: string, prompt?: string) => void;
}

export function ImageEditor({ imageUrl, onClose, onSave, onUseAsReference }: ImageEditorProps) {
  const [activeTab, setActiveTab] = useState<'crop' | 'filter' | 'ai'>('crop');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  
  // AI Prompt
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Filters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  // Debounce apply filter
  const applyFiltersToCanvas = () => {
    if (!imgRef.current) return imageUrl;
    
    const canvas = document.createElement('canvas');
    let scaleX = 1;
    let scaleY = 1;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = imgRef.current.naturalWidth;
    let sourceHeight = imgRef.current.naturalHeight;

    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      sourceX = completedCrop.x * scaleX;
      sourceY = completedCrop.y * scaleY;
      sourceWidth = completedCrop.width * scaleX;
      sourceHeight = completedCrop.height * scaleY;
    }

    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageUrl;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(
      imgRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight
    );
    
    return canvas.toDataURL('image/jpeg');
  };

  const handleSave = () => {
    const finalImage = applyFiltersToCanvas();
    onSave(finalImage);
  };

  const handleUseAi = () => {
    const finalImage = applyFiltersToCanvas();
    onUseAsReference(finalImage, aiPrompt);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950/90 backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10 glass-panel">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-bold tracking-widest uppercase text-xs">Lab Editor</span>
        <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2">
          <Check className="w-4 h-4" /> Save
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Editor Area */}
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-auto relative">
          <div className="max-w-full max-h-full" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }}>
            {activeTab === 'crop' ? (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                <img ref={imgRef} src={imageUrl} alt="Edit" className="max-h-[60vh] md:max-h-[70vh] object-contain rounded-xl shadow-2xl" crossOrigin="anonymous" />
              </ReactCrop>
            ) : (
              <img ref={imgRef} src={imageUrl} alt="Edit" className="max-h-[60vh] md:max-h-[70vh] object-contain rounded-xl shadow-2xl" crossOrigin="anonymous" />
            )}
          </div>
        </div>

        {/* Tools Panel */}
        <div className="w-full md:w-80 bg-black/50 border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col gap-8 custom-scrollbar overflow-y-auto">
          
          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl">
            <button 
              onClick={() => setActiveTab('crop')}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${activeTab === 'crop' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
            >
              <CropIcon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Crop</span>
            </button>
            <button 
              onClick={() => setActiveTab('filter')}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${activeTab === 'filter' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Adjust</span>
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${activeTab === 'ai' ? 'bg-indigo-500/20 text-indigo-400 shadow-lg border border-indigo-500/30' : 'text-indigo-400/40 hover:text-indigo-400/70'}`}
            >
              <Wand2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">AI Sync</span>
            </button>
          </div>

          {/* Tools Area */}
          {activeTab === 'crop' && (
            <div className="space-y-4">
              <p className="text-xs text-white/50 leading-relaxed font-medium">Drag on the image to select a cropping area. If no area is selected, the full image is preserved.</p>
              {completedCrop && completedCrop.width > 0 && (
                <button 
                  onClick={() => setCrop(undefined)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors border border-white/10"
                >
                  Clear Selection
                </button>
              )}
            </div>
          )}

          {activeTab === 'filter' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Brightness</label>
                  <span className="text-[10px] text-white/40 font-mono">{brightness}%</span>
                </div>
                <input 
                  type="range" min="0" max="200" value={brightness} 
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Contrast</label>
                  <span className="text-[10px] text-white/40 font-mono">{contrast}%</span>
                </div>
                <input 
                  type="range" min="0" max="200" value={contrast} 
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Saturation</label>
                  <span className="text-[10px] text-white/40 font-mono">{saturation}%</span>
                </div>
                <input 
                  type="range" min="0" max="200" value={saturation} 
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <button 
                  onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors border border-white/10 mt-4"
                >
                  Reset Filters
              </button>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-4">
                <Wand2 className="w-6 h-6 text-indigo-400 shrink-0" />
                <p className="text-xs text-indigo-200/80 leading-relaxed font-medium">Use this image as a reference for AI Generation. Your current crop and filter settings will be applied.</p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest px-1">Quick Enhancements</p>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => setAiPrompt('Upscale and enhance details, 4k high resolution')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-center border border-white/10 text-white transition-colors">Upscale</button>
                   <button onClick={() => setAiPrompt('Convert to high quality anime style')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-center border border-white/10 text-white transition-colors">Anime Style</button>
                   <button onClick={() => setAiPrompt('Convert to highly detailed pixel art')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-center border border-white/10 text-white transition-colors">Pixel Art</button>
                   <button onClick={() => setAiPrompt('Convert to hyper-realistic photorealistic style')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-center border border-white/10 text-white transition-colors">Photoreal</button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest px-1">Custom Enhancement</p>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Or describe how you want to enhance this image..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 h-24 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
                />
              </div>

              <button onClick={handleUseAi} className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold tracking-widest uppercase transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
                <Wand2 className="w-4 h-4" /> Load to Generator
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
