import React, { useState } from 'react';
import { Shield, Globe, Lock, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface UnblockerProps {
  onBack: () => void;
  onNavigateToBrowser: (url: string) => void;
}

export function Unblocker({ onBack, onNavigateToBrowser }: UnblockerProps) {
  const [url, setUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleUnblock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setIsConnecting(true);
    
    // Simulate connection to proxy network
    setTimeout(() => {
      setIsConnecting(false);
      let finalUrl = url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
      // Pass the URL to the browser, which has proxy capabilities
      onNavigateToBrowser(finalUrl);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center p-4 relative z-10">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ArrowRight className="w-6 h-6 rotate-180" />
        </button>
        <h1 className="text-xl font-bold ml-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-red-500" />
          Site Unblocker
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)] relative">
            {isConnecting ? (
              <RefreshCw className="w-10 h-10 text-white animate-spin" />
            ) : (
              <Globe className="w-10 h-10 text-white" />
            )}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border-4 border-zinc-900">
              <Lock className="w-4 h-4 text-green-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">Bypass Restrictions</h2>
          <p className="text-zinc-400 text-sm mb-8">
            Access any blocked website securely through our encrypted proxy network. Your connection is private and anonymous.
          </p>

          <form onSubmit={handleUnblock} className="w-full relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter blocked website URL..."
              className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl py-4 pl-5 pr-16 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
            />
            <button 
              type="submit"
              disabled={isConnecting || !url.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 rounded-xl flex items-center justify-center transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </form>

          <div className="mt-8 grid grid-cols-3 gap-4 w-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Encrypted</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Global</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Anonymous</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
