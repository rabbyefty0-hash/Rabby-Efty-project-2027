import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Image as ImageIcon, Video, Mic, Shield, Globe, DownloadCloud, ThumbsUp, Smartphone, Swords, Activity, CreditCard, Mail, MessageCircle, Phone, Folder, Search, TrendingUp, Calculator, StickyNote, CloudRain, Calendar, Map, Camera, Clock, Users, Music, Settings, Palette, ImagePlus, Images, Wand2 } from 'lucide-react';
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
];

const CATEGORIES = [
  {
    name: "Suggestions",
    apps: ['image', 'video', 'music', 'whatsapp']
  },
  {
    name: "Creativity",
    apps: ['image', 'video', 'voice', 'music', 'camera', 'gallery', 'arena-ai']
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

  const renderAppIcon = (app: any, idx: number, size: 'normal' | 'mini' = 'normal') => {
    const isMini = size === 'mini';
    const sizeClass = isMini ? 'w-full h-full' : getIconSizeClass();
    const iconSizeClass = isMini ? 'w-1/2 h-1/2' : 'w-6 h-6 sm:w-8 sm:h-8';
    
    return (
      <motion.div
        key={app.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.02, type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative flex flex-col items-center ${isMini ? 'w-full h-full' : ''}`}
      >
        {isLoading ? (
          <div className={`flex flex-col items-center space-y-1.5 w-full animate-pulse ${isMini ? '' : 'p-1'}`}>
            <div className={`${sizeClass} ${getIconShapeClass()} bg-white/10`} />
            {!isMini && <div className="h-3 w-12 bg-white/10 rounded-full mt-1" />}
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(app.id);
            }}
            className={`flex flex-col items-center group w-full active:opacity-70 ${isMini ? 'h-full' : 'space-y-1.5 p-1'}`}
          >
            <div className={`${sizeClass} ${getIconShapeClass()} ${app.bg} flex items-center justify-center mx-auto ios-icon transition-all duration-300 group-hover:scale-105 group-active:scale-95 shadow-sm`}>
              <app.icon className={`${iconSizeClass} ${app.color} drop-shadow-md relative z-10`} strokeWidth={1.5} />
            </div>
            {!isMini && (
              <span className="text-[10px] sm:text-[11px] font-medium text-white/90 truncate w-full text-center drop-shadow-md tracking-wide">{app.name}</span>
            )}
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar h-full w-full">
      <div className="max-w-md mx-auto relative px-6">
        {/* Sticky Search Bar */}
        <div className="sticky top-0 z-50 pt-14 pb-4 bg-zinc-950/80 backdrop-blur-xl -mx-6 px-6 mb-6">
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
          <div className="grid grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-6 content-start px-1 sm:px-2 pb-8">
            {filteredApps.map((app, idx) => renderAppIcon(app, idx))}
            {filteredApps.length === 0 && (
              <div className="col-span-4 text-center py-12 text-white/50">
                No apps found matching "{searchQuery}"
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-8">
            {CATEGORIES.map((category, catIdx) => {
              const categoryApps = category.apps.map(id => APPS.find(a => a.id === id)).filter(Boolean);
              if (categoryApps.length === 0) return null;
              
              const isExpanded = expandedCategory === category.name;
              
              return (
                <motion.div 
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.1 }}
                  className={`flex flex-col ${isExpanded ? 'col-span-2' : 'col-span-1'}`}
                >
                  <div className="flex justify-between items-center px-2 mb-2">
                    <h3 className="text-white/90 font-medium text-sm tracking-tight">{category.name}</h3>
                  </div>
                  
                  <div 
                    className={`bg-white/10 border border-white/10 rounded-3xl p-3 backdrop-blur-md shadow-lg transition-all duration-300 ${isExpanded ? 'bg-white/15' : 'hover:bg-white/15 cursor-pointer'}`}
                    onClick={() => !isExpanded && setExpandedCategory(category.name)}
                  >
                    {isExpanded ? (
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCategory(null);
                          }}
                          className="absolute -top-2 -right-2 bg-white/20 hover:bg-white/30 p-1.5 rounded-full backdrop-blur-md z-10 transition-colors"
                        >
                          <Search className="w-4 h-4 text-white" />
                        </button>
                        <div className="grid grid-cols-4 gap-3 pt-2">
                          {categoryApps.map((app, idx) => renderAppIcon(app, idx))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 aspect-square">
                        {categoryApps.slice(0, 4).map((app, idx) => (
                          <div key={app?.id || idx} className="w-full h-full">
                            {renderAppIcon(app, idx, 'mini')}
                          </div>
                        ))}
                        {/* Fill empty spots if less than 4 apps */}
                        {Array.from({ length: Math.max(0, 4 - categoryApps.length) }).map((_, i) => (
                          <div key={`empty-${i}`} className="w-full h-full rounded-xl bg-white/5" />
                        ))}
                      </div>
                    )}
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
  );
}
