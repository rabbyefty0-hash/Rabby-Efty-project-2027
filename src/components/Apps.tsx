import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Image as ImageIcon, Video, Mic, Shield, Globe, DownloadCloud, ThumbsUp, Smartphone, Swords, Activity, CreditCard, Mail, MessageCircle, Phone, Folder, Search, TrendingUp, Calculator, StickyNote, CloudRain, Calendar, Map, Camera, Clock, Users, Music, Settings, Palette, ImagePlus, Images, Wand2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../ThemeContext';

interface AppsProps {
  onNavigate: (tab: any) => void;
  isVpnConnected: boolean;
  setIsVpnConnected: (val: boolean) => void;
}

// Define apps outside component to prevent reallocation on every render
const APPS = [
  { id: 'build-apk', name: 'APK Builder', icon: Smartphone, color: 'text-white', bg: 'bg-gradient-to-br from-emerald-400 to-teal-600' },
  { id: 'image', name: 'AI Image', icon: Wand2, color: 'text-white', bg: 'bg-gradient-to-br from-indigo-400 to-purple-600' },
  { id: 'video', name: 'Video', icon: Video, color: 'text-white', bg: 'bg-gradient-to-br from-pink-400 to-rose-600' },
  { id: 'voice', name: 'Voice', icon: Mic, color: 'text-white', bg: 'bg-gradient-to-br from-rose-400 to-orange-500' },
  { id: 'vpn', name: 'VPN', icon: Shield, color: 'text-white', bg: 'bg-gradient-to-br from-teal-400 to-emerald-600' },
  { id: 'browser', name: 'Browser', icon: Globe, color: 'text-white', bg: 'bg-gradient-to-br from-blue-400 to-indigo-600' },
  { id: 'downloader', name: 'Downloader', icon: DownloadCloud, color: 'text-white', bg: 'bg-gradient-to-br from-cyan-400 to-blue-600' },
  { id: 'status', name: 'Status', icon: Activity, color: 'text-white', bg: 'bg-gradient-to-br from-indigo-500 to-blue-700' },
  { id: 'card-gen', name: 'Card Gen', icon: CreditCard, color: 'text-white', bg: 'bg-gradient-to-br from-emerald-400 to-green-600' },
  { id: 'arena-ai', name: 'Arena AI', icon: Swords, color: 'text-white', bg: 'bg-gradient-to-br from-orange-400 to-red-600' },
  { id: 'ai-search', name: 'AI Search', icon: Search, color: 'text-white', bg: 'bg-gradient-to-br from-blue-500 to-purple-600' },
  { id: 'fb-autolike', name: 'FB Liker', icon: ThumbsUp, color: 'text-white', bg: 'bg-gradient-to-br from-blue-500 to-blue-700' },
  { id: 'temp-mail', name: 'Temp Mail', icon: Mail, color: 'text-white', bg: 'bg-gradient-to-br from-violet-400 to-purple-600' },
  { id: 'temp-number', name: 'Temp Number', icon: Phone, color: 'text-white', bg: 'bg-gradient-to-br from-blue-400 to-cyan-600' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-white', bg: 'bg-gradient-to-br from-green-400 to-emerald-600' },
  { id: 'file-manager', name: 'Files', icon: Folder, color: 'text-white', bg: 'bg-gradient-to-br from-blue-400 to-indigo-500' },
  { id: 'gallery', name: 'Photos', icon: Images, color: 'text-white', bg: 'bg-gradient-to-br from-purple-400 to-pink-600' },
  { id: 'followeran', name: 'Followeran', icon: TrendingUp, color: 'text-white', bg: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
  { id: 'settings', name: 'Settings', icon: Palette, color: 'text-white', bg: 'bg-gradient-to-br from-gray-600 to-zinc-800' },
  { id: 'calculator', name: 'Calculator', icon: Calculator, color: 'text-white', bg: 'bg-gradient-to-br from-orange-400 to-amber-600' },
  { id: 'notes', name: 'Notes', icon: StickyNote, color: 'text-white', bg: 'bg-gradient-to-br from-yellow-400 to-orange-500' },
  { id: 'weather', name: 'Weather', icon: CloudRain, color: 'text-white', bg: 'bg-gradient-to-br from-blue-300 to-cyan-500' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, color: 'text-white', bg: 'bg-gradient-to-br from-red-400 to-rose-600' },
  { id: 'maps', name: 'Maps', icon: Map, color: 'text-white', bg: 'bg-gradient-to-br from-green-500 to-emerald-700' },
  { id: 'camera', name: 'Camera', icon: Camera, color: 'text-white', bg: 'bg-gradient-to-br from-zinc-700 to-black' },
  { id: 'clock', name: 'Clock', icon: Clock, color: 'text-white', bg: 'bg-gradient-to-br from-black to-gray-800' },
  { id: 'contacts', name: 'Contacts', icon: Users, color: 'text-white', bg: 'bg-gradient-to-br from-blue-400 to-indigo-500' },
  { id: 'music', name: 'Music', icon: Music, color: 'text-white', bg: 'bg-gradient-to-br from-pink-500 to-rose-600' },
  { id: 'youtube', name: 'YouTube', icon: Video, color: 'text-white', bg: 'bg-gradient-to-br from-red-500 to-red-700' },
];

const CATEGORIES = [
  {
    name: "Suggestions",
    apps: ['image', 'video', 'music', 'whatsapp']
  },
  {
    name: "Creativity",
    apps: ['image', 'video', 'voice', 'music', 'camera', 'gallery', 'arena-ai', 'ai-search', 'youtube']
  },
  {
    name: "Social",
    apps: ['whatsapp', 'temp-mail', 'temp-number', 'contacts', 'fb-autolike', 'followeran']
  },
  {
    name: "Utilities",
    apps: ['calculator', 'notes', 'weather', 'clock', 'calendar', 'maps', 'file-manager', 'settings']
  },
  {
    name: "Productivity",
    apps: ['vpn', 'browser', 'downloader', 'status', 'card-gen', 'build-apk']
  }
];

export function Apps({ onNavigate, isVpnConnected, setIsVpnConnected }: AppsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(() => {
    return sessionStorage.getItem('appsLoaded') !== 'true';
  });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { iconShape, iconSize } = useTheme();

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('appsLoaded', 'true');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const filteredApps = useMemo(() => {
    if (!searchQuery) return APPS;
    return APPS.filter(app => app.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const getIconShapeClass = () => {
    switch (iconShape) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-md';
      case 'squircle': default: return 'rounded-[1.4rem]';
    }
  };

  const getIconSizeClass = () => {
    switch (iconSize) {
      case 'small': return 'w-10 h-10 sm:w-[50px] sm:h-[50px]';
      case 'large': return 'w-14 h-14 sm:w-[70px] sm:h-[70px]';
      case 'medium': default: return 'w-12 h-12 sm:w-[60px] sm:h-[60px]';
    }
  };

  const renderAppIcon = (app: any, idx: number, mode: 'normal' | 'library-large' | 'library-small' = 'normal') => {
    if (mode === 'library-large') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(app.id);
          }}
          className="w-full h-full flex items-center justify-center active:opacity-70 group"
        >
          <div className={`w-[85%] h-[85%] ${getIconShapeClass()} ${app.bg} flex items-center justify-center shadow-sm transition-transform group-active:scale-90`}>
            <app.icon className="w-1/2 h-1/2 text-white drop-shadow-md" strokeWidth={1.5} />
          </div>
        </button>
      );
    }

    if (mode === 'library-small') {
      return (
        <div className={`w-full h-full ${getIconShapeClass()} ${app.bg} flex items-center justify-center shadow-sm`}>
          <app.icon className="w-1/2 h-1/2 text-white drop-shadow-sm" strokeWidth={1.5} />
        </div>
      );
    }

    return (
      <motion.div
        key={app.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.02, type: 'spring', stiffness: 300, damping: 20 }}
        className="relative flex flex-col items-center"
      >
        {isLoading ? (
          <div className="flex flex-col items-center space-y-1.5 w-full animate-pulse p-1">
            <div className={`${getIconSizeClass()} ${getIconShapeClass()} bg-white/10`} />
            <div className="h-3 w-12 bg-white/10 rounded-full mt-1" />
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(app.id);
            }}
            className="flex flex-col items-center group w-full active:opacity-70 space-y-1.5 p-1"
          >
            <div className={`${getIconSizeClass()} ${getIconShapeClass()} ${app.bg} flex items-center justify-center mx-auto ios-icon transition-all duration-300 group-hover:scale-105 group-active:scale-95 shadow-sm`}>
              <app.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${app.color} drop-shadow-md relative z-10`} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-white/90 truncate w-full text-center drop-shadow-md tracking-wide">{app.name}</span>
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar h-full w-full">
        <div className="max-w-5xl mx-auto relative px-6">
          {/* Sticky Search Bar */}
          <div className="sticky top-0 z-40 pt-14 pb-4 bg-zinc-950/80 backdrop-blur-xl -mx-6 px-6 mb-6">
            <div className="relative z-10">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="App Library"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 dark:bg-black/40 border border-white/20 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-xl shadow-lg"
              />
            </div>
          </div>

          {searchQuery ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-2 sm:gap-x-4 gap-y-6 content-start px-1 sm:px-2 pb-8">
              {filteredApps.map((app, idx) => renderAppIcon(app, idx, 'normal'))}
              {filteredApps.length === 0 && (
                <div className="col-span-full text-center py-12 text-white/50">
                  No apps found matching "{searchQuery}"
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
              {CATEGORIES.map((category, catIdx) => {
                const categoryApps = category.apps.map(id => APPS.find(a => a.id === id)).filter(Boolean);
                if (categoryApps.length === 0) return null;
                
                return (
                  <motion.div 
                    key={category.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.1 }}
                    className="flex flex-col"
                  >
                    <div className="flex justify-between items-center px-3 mb-1.5">
                      <h3 className="text-white/90 font-medium text-[13px] tracking-wide">{category.name}</h3>
                    </div>
                    
                    <div className="bg-white/10 border border-white/10 rounded-[2rem] p-3 backdrop-blur-md shadow-lg aspect-square">
                      <div className="grid grid-cols-2 gap-2 w-full h-full">
                        {categoryApps[0] && <div className="w-full h-full">{renderAppIcon(categoryApps[0], 0, 'library-large')}</div>}
                        {categoryApps[1] && <div className="w-full h-full">{renderAppIcon(categoryApps[1], 1, 'library-large')}</div>}
                        {categoryApps[2] && <div className="w-full h-full">{renderAppIcon(categoryApps[2], 2, 'library-large')}</div>}
                        
                        {categoryApps.length > 4 ? (
                          <button 
                            onClick={() => setExpandedCategory(category.name)}
                            className="w-full h-full grid grid-cols-2 gap-1.5 p-1 active:opacity-70 group"
                          >
                            {categoryApps.slice(3, 7).map((app, i) => (
                              <div key={app?.id || i} className="w-full h-full transition-transform group-active:scale-95">
                                {renderAppIcon(app, i, 'library-small')}
                              </div>
                            ))}
                          </button>
                        ) : categoryApps[3] ? (
                          <div className="w-full h-full">{renderAppIcon(categoryApps[3], 3, 'library-large')}</div>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {/* Bottom Spacer for Dock */}
          <div className="h-48 w-full shrink-0" />
        </div>
      </div>

      {/* Expanded Category Overlay */}
      <AnimatePresence>
        {expandedCategory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-[60] bg-zinc-900/80 backdrop-blur-3xl flex flex-col"
          >
            <div className="pt-14 pb-6 px-6 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white tracking-tight">{expandedCategory}</h2>
              <button 
                onClick={() => setExpandedCategory(null)} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-2 sm:gap-x-4 gap-y-6 content-start">
                {CATEGORIES.find(c => c.name === expandedCategory)?.apps
                  .map(id => APPS.find(a => a.id === id))
                  .filter(Boolean)
                  .map((app, idx) => renderAppIcon(app, idx, 'normal'))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
