import React, { useRef } from 'react';
import { useTheme } from '../ThemeContext';
import { ArrowLeft, Check, Palette, Type, Square, Circle, Layout, Image as ImageIcon, Upload, Key, Trash2, Database, AlertTriangle } from 'lucide-react';

export function SettingsApp({ onBack }: { onBack: () => void }) {
  const { 
    primaryColor, setPrimaryColor, 
    fontSize, setFontSize, 
    iconShape, setIconShape, 
    iconSize, setIconSize,
    keyboardLayout, setKeyboardLayout,
    wallpaperUrl, setWallpaperUrl
  } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { addNode, generateId } = await import('../lib/vfs');
      const id = generateId();
      await addNode({
        id,
        name: file.name,
        type: 'file',
        parentId: 'root',
        data: file,
        mimeType: file.type,
        size: file.size,
        createdAt: Date.now(),
        modifiedAt: Date.now()
      });
      
      localStorage.setItem('wallpaperId', id);
      setWallpaperUrl(URL.createObjectURL(file));
      window.dispatchEvent(new CustomEvent('wallpaper-updated'));
    }
  };

  const colors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Purple', value: '#a855f7' },
  ];

  return (
    <div 
      className="flex flex-col h-full bg-[#1c1c1e] text-white overflow-y-auto custom-scrollbar"
      style={{ touchAction: 'pan-y' }}
    >
      <div 
        className="absolute inset-y-0 left-0 w-4 z-50"
        onPointerDown={(e) => {
          const startX = e.clientX;
          const handlePointerUp = (upEvent: PointerEvent) => {
            if (upEvent.clientX - startX > 50) {
              onBack();
            }
            window.removeEventListener('pointerup', handlePointerUp);
          };
          window.addEventListener('pointerup', handlePointerUp);
        }}
      />
      <div className="sticky top-0 z-10 bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 pt-10 flex items-center">
        <button onClick={onBack} className="text-primary flex items-center font-medium">
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <h1 className="text-lg font-semibold mx-auto -ml-8">Personalization</h1>
      </div>

      <div className="p-4 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accent Color */}
        <div className="bg-[#2c2c2e] rounded-xl p-4">
          <div className="flex items-center mb-4 text-white/80">
            <Palette className="w-5 h-5 mr-2" />
            <h2 className="font-medium">Accent Color</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {colors.map(c => (
              <button
                key={c.value}
                onClick={() => setPrimaryColor(c.value)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: c.value }}
              >
                {primaryColor === c.value && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-[#2c2c2e] rounded-xl p-4">
          <div className="flex items-center mb-4 text-white/80">
            <Type className="w-5 h-5 mr-2" />
            <h2 className="font-medium">Font Size</h2>
          </div>
          <div className="flex bg-[#1c1c1e] rounded-lg p-1">
            {(['small', 'medium', 'large'] as const).map(size => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors ${fontSize === size ? 'bg-[#3a3a3c] text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Shape */}
        <div className="bg-[#2c2c2e] rounded-xl p-4">
          <div className="flex items-center mb-4 text-white/80">
            <Square className="w-5 h-5 mr-2" />
            <h2 className="font-medium">Icon Shape</h2>
          </div>
          <div className="flex bg-[#1c1c1e] rounded-lg p-1">
            {(['circle', 'squircle', 'square'] as const).map(shape => (
              <button
                key={shape}
                onClick={() => setIconShape(shape)}
                className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors ${iconShape === shape ? 'bg-[#3a3a3c] text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Size */}
        <div className="bg-[#2c2c2e] rounded-xl p-4">
          <div className="flex items-center mb-4 text-white/80">
            <Circle className="w-5 h-5 mr-2" />
            <h2 className="font-medium">Icon Size</h2>
          </div>
          <div className="flex bg-[#1c1c1e] rounded-lg p-1">
            {(['small', 'medium', 'large'] as const).map(size => (
              <button
                key={size}
                onClick={() => setIconSize(size)}
                className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors ${iconSize === size ? 'bg-[#3a3a3c] text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Wallpaper */}
        <div className="bg-[#2c2c2e] rounded-xl p-4 md:col-span-2">
          <div className="flex items-center mb-4 text-white/80">
            <ImageIcon className="w-5 h-5 mr-2" />
            <h2 className="font-medium">Desktop Wallpaper</h2>
          </div>
          <div className="flex flex-col gap-3">
            <div 
              className="w-full h-32 rounded-lg bg-cover bg-center border border-white/10 relative overflow-hidden group"
              style={{ backgroundImage: `url(${wallpaperUrl})` }}
            >
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Wallpaper
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/50">Custom Image</span>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary hover:opacity-80 font-medium px-3 py-1.5 bg-primary/10 rounded-lg transition-colors"
              >
                Upload
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto pb-2 custom-scrollbar">
              {[
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1506744626753-eba7bc3535e7?q=80&w=2564&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2564&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2564&auto=format&fit=crop"
              ].map((url, i) => (
                <button
                  key={i}
                  onClick={() => {
                    localStorage.removeItem('wallpaperId');
                    setWallpaperUrl(url);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg bg-cover bg-center border-2 transition-all ${wallpaperUrl === url ? 'border-primary scale-105' : 'border-transparent hover:border-white/20'}`}
                  style={{ backgroundImage: `url(${url})` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="bg-[#2c2c2e] rounded-xl p-4 md:col-span-2">
          <div className="flex items-center mb-4 text-white/80">
            <Key className="w-5 h-5 mr-2" />
            <h2 className="font-medium">API Key</h2>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-white/60">
              Set your own Gemini API key for advanced features and continuous live voice chat.
            </p>
            <div className="flex gap-2">
              <input 
                type="password" 
                placeholder="Enter Gemini API Key..."
                className="flex-1 bg-[#1c1c1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                defaultValue={localStorage.getItem('custom_gemini_api_key') || ''}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  if (val) {
                    localStorage.setItem('custom_gemini_api_key', val);
                  } else {
                    localStorage.removeItem('custom_gemini_api_key');
                  }
                }}
              />
              <button 
                onClick={async () => {
                  if (window.aistudio?.openSelectKey) {
                    await window.aistudio.openSelectKey();
                  } else {
                    alert("API Key saved locally.");
                  }
                }}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Select Key
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard Layout */}
        <div className="bg-[#2c2c2e] rounded-xl p-4">
          <div className="flex items-center mb-4 text-white/80">
            <Layout className="w-5 h-5 mr-2" />
            <h2 className="font-medium">Keyboard / Input Layout</h2>
          </div>
          <div className="flex bg-[#1c1c1e] rounded-lg p-1">
            {(['default', 'compact', 'floating'] as const).map(layout => (
              <button
                key={layout}
                onClick={() => setKeyboardLayout(layout)}
                className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors ${keyboardLayout === layout ? 'bg-[#3a3a3c] text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
              >
                {layout}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-3">
            Changes the padding and layout style of input fields across the OS.
          </p>
        </div>

        {/* Clear Local Data Settings Group */}
        <div className="bg-[#2c2c2e] rounded-xl p-4 md:col-span-2 space-y-4">
          <div className="flex items-center text-white/80 border-b border-white/5 pb-2">
            <Trash2 className="w-5 h-5 mr-2 text-rose-500" />
            <h2 className="font-semibold text-rose-500">Storage & Reset Controls</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            <p className="text-xs text-white/60 leading-relaxed">
              Wipe specific segments of local application storage to free up space. Deleted data is gone permanently and cannot be recovered.
            </p>

            <div className="space-y-3.5 pt-2">
              {/* Category 1: Generated Images */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-3.5 gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white/95">Generated Creative Images</span>
                  <span className="text-[11px] text-white/50">Wipes base64 streams of all generated artworks/photos</span>
                </div>
                <button
                  onClick={async () => {
                    const confirmClear = window.confirm("Are you sure you want to clear all cached generated images? This action is irreversible.");
                    if (confirmClear) {
                      localStorage.removeItem('generatedImages');
                      window.dispatchEvent(new Event('generatedImages-updated'));
                      alert("Successfully cleared all generated image history!");
                    }
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/20 text-rose-400 font-bold text-xs py-2 px-4 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Images
                </button>
              </div>

              {/* Category 2: Cached Chat Sessions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-3.5 gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white/95">Cached Chat Sessions</span>
                  <span className="text-[11px] text-white/50">Resets the AI chatbot conversations and prompt metrics</span>
                </div>
                <button
                  onClick={async () => {
                    const confirmClear = window.confirm("Are you sure you want to clear your local chat threads? This will reset your chatbot history.");
                    if (confirmClear) {
                      localStorage.removeItem('chatSessions');
                      window.dispatchEvent(new Event('chatSessions-updated'));
                      alert("Successfully cleared all local chatbot history!");
                    }
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/20 text-rose-400 font-bold text-xs py-2 px-4 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Chat Logs
                </button>
              </div>

              {/* Category 3: Downloaded VFS Media */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-3.5 gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white/95">Downloaded Media & Documents</span>
                  <span className="text-[11px] text-white/50">Erases all downloaded files, mock media, and uploads in the Virtual File System</span>
                </div>
                <button
                  onClick={async () => {
                    const confirmClear = window.confirm("Are you sure you want to delete all local folders, documents, and VFS files from IndexedDB?");
                    if (confirmClear) {
                      const { clearVFS } = await import('../lib/vfs');
                      await clearVFS();
                      alert("Successfully cleared all VFS folders, documents, and media!");
                    }
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/20 text-rose-400 font-bold text-xs py-2 px-4 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Wipe Media System
                </button>
              </div>

              {/* Full Factory Reset Option */}
              <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    Master All-Data Wipe
                  </span>
                  <p className="text-[11px] text-rose-300/80 leading-relaxed max-w-md">
                    Instantly wipes ALL local storage, wallpaper IDs, personalization options, IndexedDB files, and authorization credentials, restoring the OS back to initial defaults.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const confirmClear = window.confirm("CRITICAL RESET CONFIRMATION:\nAre you sure you want to perform a full system wipe and factory reset? This will reset ALL themes, wallpapers, chat histories, generated pictures, and offline file databases.");
                    if (confirmClear) {
                      const { clearVFS } = await import('../lib/vfs');
                      await clearVFS();
                      localStorage.clear();
                      alert("All local databases and system variables have been fully wiped. The workspace will now reload.");
                      window.location.reload();
                    }
                  }}
                  className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-xs py-2.5 px-5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Factory Reset App
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
