import React, { useState, useEffect, memo } from 'react';
import { Sparkles, Video, Mic, Shield, Globe, DownloadCloud, ThumbsUp, Smartphone, Swords, Activity, CreditCard, Mail, MessageCircle, Phone, Folder, Cloud, Battery, Calendar, Search, Clock, Images } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../ThemeContext';
import { APPS } from '../App';

interface HomeProps {
  onNavigate: (tab: any) => void;
  recentApps: any[];
}

const ClockWidget = memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="w-full relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-[2rem] blur-xl transition-all duration-500 group-hover:blur-2xl" />
      <div className="relative bg-black/20 dark:bg-black/40 backdrop-blur-[50px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)] rounded-[2rem] p-6 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-1 mb-1 opacity-80">
           <span className="text-xs font-medium tracking-widest uppercase text-white/90">
             {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
           </span>
        </div>
        
        <div className="relative">
          <h1 className="text-[5.5rem] leading-none font-extralight tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-lg mb-1" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 mt-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
           <Sparkles className="w-3 h-3 text-rose-300" />
           <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-white/90">{getGreeting()}</span>
        </div>
      </div>
    </div>
  );
});

const ArenaAiWidget = memo(({ onNavigate }: { onNavigate: (tab: any) => void }) => {
  return (
    <div 
      onClick={() => onNavigate('arena-ai')}
      className="w-full h-full min-h-[7rem] bg-gradient-to-br from-orange-500/80 to-rose-600/80 rounded-[1.8rem] backdrop-blur-[50px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.3)] overflow-hidden relative cursor-pointer group hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/30 rounded-full blur-2xl group-hover:bg-yellow-400/50 transition-colors duration-500" />
      
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
            <Swords className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-white">Arena AI</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
        </div>
        
        <div>
          <h2 className="text-white font-bold text-lg leading-tight mb-0.5 drop-shadow-md">Battle Models</h2>
          <p className="text-white/80 text-xs font-medium drop-shadow-sm">Compare AI models side-by-side</p>
        </div>
      </div>
    </div>
  );
});

const SmartStackWidget = memo(({ onNavigate }: { onNavigate: (tab: any) => void }) => {
  const [currentWidget, setCurrentWidget] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentWidget((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered]);

  return (
    <div 
      className="w-full h-full min-h-[7rem] bg-black/20 dark:bg-black/40 rounded-[1.8rem] backdrop-blur-[50px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)] overflow-hidden relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {currentWidget === 0 && (
          <motion.div
            key="weather"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 p-4 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white/80 font-medium text-sm">Cupertino</h3>
                <h1 className="text-3xl font-light text-white">72°</h1>
              </div>
              <Cloud className="w-6 h-6 text-white/90" />
            </div>
            <div className="text-white/70 text-xs font-medium">Mostly Cloudy • H:75° L:58°</div>
          </motion.div>
        )}
        {currentWidget === 1 && (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 p-4 flex flex-col justify-between bg-gradient-to-br from-indigo-500/30 to-purple-500/30"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white/90 font-medium text-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  Gemini Live
                </h3>
                <p className="text-white/70 text-xs mt-0.5">Ready to assist</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onNavigate('voice')} className="bg-white/20 rounded-xl p-1.5 flex items-center justify-center gap-1.5 flex-1 backdrop-blur-md hover:bg-white/30 transition-colors border border-white/10">
                <Mic className="w-3.5 h-3.5 text-rose-300" />
                <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Voice Chat</span>
              </button>
              <button onClick={() => onNavigate('whatsapp')} className="bg-white/20 rounded-xl p-1.5 flex items-center justify-center gap-1.5 flex-1 backdrop-blur-md hover:bg-white/30 transition-colors border border-white/10">
                <MessageCircle className="w-3.5 h-3.5 text-green-300" />
                <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Message</span>
              </button>
            </div>
          </motion.div>
        )}
        {currentWidget === 2 && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 p-4 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-400" />
                <h3 className="text-white/80 font-medium uppercase text-[10px] tracking-wider">Up Next</h3>
              </div>
            </div>
            <div>
              <h2 className="text-white font-medium text-base">Design Review</h2>
              <p className="text-white/60 text-xs">1:00 PM - 2:00 PM</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Widget Pagination Dots */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className={`w-1 rounded-full transition-all duration-300 ${currentWidget === i ? 'h-2.5 bg-white' : 'h-1 bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
});

export function Home({ onNavigate, recentApps }: HomeProps) {
  const { iconShape, iconSize } = useTheme();

  const getIconShapeClass = () => {
    switch (iconShape) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-md';
      case 'squircle': default: return 'rounded-[1.4rem]';
    }
  };

  const getIconSizeClass = () => {
    switch (iconSize) {
      case 'small': return 'w-[50px] h-[50px]';
      case 'large': return 'w-[70px] h-[70px]';
      case 'medium': default: return 'w-[60px] h-[60px]';
    }
  };

  return (
    <motion.div 
      className="flex-1 overflow-y-auto p-2 sm:p-4 pt-16 pb-32 relative z-10 custom-scrollbar h-full w-full"
    >
      <div className="w-full h-full relative">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <ClockWidget />
          <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-2">
            <SmartStackWidget onNavigate={onNavigate} />
            <ArenaAiWidget onNavigate={onNavigate} />
          </div>
        </div>

        {/* Recently Used Apps Carousel */}
        {recentApps && recentApps.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-3 pl-1">
              <Clock className="w-3.5 h-3.5 text-white/50" />
              <h3 className="text-white/70 font-medium text-[10px] tracking-widest uppercase">Recent</h3>
            </div>
            <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 pt-1 px-1">
              {recentApps.map((app, index) => (
                <motion.button
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5), type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => onNavigate(app.id)}
                  className="flex flex-col items-center space-y-1.5 group flex-shrink-0 w-[60px] sm:w-[70px]"
                >
                  <div className={`${getIconSizeClass()} ${getIconShapeClass()} ${app.bg || 'bg-white/10'} backdrop-blur-[40px] border border-white/20 shadow-[0_4px_12px_0_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center ios-icon relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-50 pointer-events-none" />
                    <app.icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${app.color || 'text-white'} drop-shadow-md relative z-10`} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-medium text-white/90 truncate w-full text-center drop-shadow-md tracking-wide">{app.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Home Screen Apps Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-y-6 gap-x-2 sm:gap-x-4 mb-8 mt-4 px-1 sm:px-2">
          {APPS.filter(app => ['camera', 'gallery', 'image', 'file-manager', 'browser', 'unblocker', 'youtube', 'whatsapp', 'settings', 'calculator', 'weather', 'calendar', 'clock', 'music', 'maps', 'contacts', 'downloader'].includes(app.id)).map((app, index) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              transition={{ delay: Math.min(index * 0.05, 0.5), type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => onNavigate(app.id)}
              className="flex flex-col items-center space-y-1.5 group"
            >
              <div className={`${getIconSizeClass()} ${getIconShapeClass()} ${app.bg || 'bg-white/10'} backdrop-blur-[40px] border border-white/20 shadow-[0_4px_12px_0_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center ios-icon relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-50 pointer-events-none" />
                <app.icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${app.color || 'text-white'} drop-shadow-md relative z-10`} strokeWidth={1.5} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-white/90 truncate w-full text-center drop-shadow-md tracking-wide">{app.name}</span>
            </motion.button>
          ))}
        </div>

      </div>
    </motion.div>
  );
}
