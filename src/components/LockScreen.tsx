import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Circle } from 'lucide-react';

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
      {/* Wallpaper with direct, vibrant rendering */}
      <div className="absolute inset-0 z-0">
        <img src={wallpaperUrl} alt="Wallpaper" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/5" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center pt-28 h-full">
        {/* Date and Time Header */}
        <div className="text-center select-none">
          <h2 className="text-[19px] sm:text-[21px] font-medium text-white/90 tracking-wide mb-1.5">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <h1 className="text-[72px] sm:text-[84px] font-light tracking-normal text-white/95 leading-none mt-2.5">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </h1>
        </div>
        
        {/* Absolute Bottom Quick-Actions & Unlock Pill */}
        {/* Circular Action Buttons - Left and Right are perfectly circular like in the screenshot */}
        <div className="absolute bottom-12 left-8 z-20">
          <button className="w-12 h-12 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-black/40 active:scale-95 transition-all outline-none">
            <Circle className="w-5 h-5 text-white/90 stroke-[1.5]" />
          </button>
        </div>

        <div className="absolute bottom-12 right-8 z-20">
          <button className="w-12 h-12 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-black/40 active:scale-95 transition-all outline-none">
            <ImageIcon className="w-5 h-5 text-white/90 stroke-[1.5]" />
          </button>
        </div>

        {/* Center Swipe-up and Pillar */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center justify-center select-none">
          <motion.div 
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.y < -50) {
                onUnlock();
              }
            }}
            className="flex flex-col items-center cursor-grab active:cursor-grabbing w-full"
          >
            <motion.span 
              animate={{ opacity: [0.4, 0.9, 0.4], y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="text-xs sm:text-[13px] font-medium text-white/90 mb-3 tracking-wide"
            >
              Swipe up to unlock
            </motion.span>
            <div className="w-24 h-[5px] bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.15)]" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
