import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon } from 'lucide-react';

interface LockScreenProps {
  wallpaperUrl: string;
  iconShape: string;
  onUnlock: () => void;
}

export function LockScreen({ wallpaperUrl, iconShape, onUnlock }: LockScreenProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getIconShapeClass = () => {
    switch (iconShape) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-md';
      case 'squircle': default: return 'rounded-[1.4rem]';
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden font-sans relative bg-black text-white">
      <div className="absolute inset-0 z-0">
        <img src={wallpaperUrl} alt="Wallpaper" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
      </div>
      <div className="relative z-10 flex flex-col items-center pt-24 h-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium text-white/90 mb-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <h1 className="text-7xl font-light tracking-tighter">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </h1>
        </div>
        
        <div className="mt-auto mb-12 flex flex-col items-center w-full px-8">
          <div className="flex justify-between w-full mb-8 px-4">
            <button className={`w-12 h-12 ${getIconShapeClass()} bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10`}>
              <div className="w-5 h-5 rounded-full border-2 border-white/80" />
            </button>
            <button className={`w-12 h-12 ${getIconShapeClass()} bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10`}>
              <ImageIcon className="w-5 h-5 text-white/80" />
            </button>
          </div>
          
          <motion.div 
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.y < -50) {
                onUnlock();
              }
            }}
            className="flex flex-col items-center cursor-grab active:cursor-grabbing"
          >
            <span className="text-sm font-medium text-white/80 mb-2 tracking-wide">Swipe up to unlock</span>
            <div className="w-32 h-1.5 bg-white rounded-full" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
