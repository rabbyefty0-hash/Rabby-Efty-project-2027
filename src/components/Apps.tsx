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
  { id: 'unblocker', name: 'Unblocker', icon: Shield, color: 'text-white', bg: 'bg-gradient-to-br from-red-400 to-rose-600' },
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
    apps: ['vpn', 'browser', 'downloader', 'status', 'card-gen', 'build-apk', 'unblocker']
  }
];

const CATEGORIES_STYLING: Record<string, { desc: string; glow: string; border: string; highlight: string }> = {
  "Suggestions": {
    desc: "Smart Picks & Trends",
    glow: "group-hover:from-indigo-500/20 group-hover:to-pink-500/25",
    border: "border-white/10 hover:border-indigo-500/30",
    highlight: "text-indigo-400"
  },
  "Creativity": {
    desc: "Art, Audio & AI Media",
    glow: "group-hover:from-pink-500/20 group-hover:to-violet-500/25",
    border: "border-white/10 hover:border-pink-500/30",
    highlight: "text-pink-400"
  },
  "Social": {
    desc: "Communications & Mail",
    glow: "group-hover:from-emerald-500/20 group-hover:to-teal-500/25",
    border: "border-white/10 hover:border-emerald-500/30",
    highlight: "text-emerald-400"
  },
  "Utilities": {
    desc: "Tools & Personal Assistants",
    glow: "group-hover:from-amber-500/20 group-hover:to-orange-500/25",
    border: "border-white/10 hover:border-amber-500/30",
    highlight: "text-amber-400"
  },
  "Productivity": {
    desc: "VPN, Downloader & Status",
    glow: "group-hover:from-blue-500/20 group-hover:to-violet-500/25",
    border: "border-white/10 hover:border-blue-500/30",
    highlight: "text-blue-400"
  }
};

export function Apps({ onNavigate, isVpnConnected, setIsVpnConnected }: AppsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(() => {
    return sessionStorage.getItem('appsLoaded') !== 'true';
  });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [recentApps, setRecentApps] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { iconShape, iconSize } = useTheme();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recent_apps_launched');
      if (stored) {
        setRecentApps(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load recent apps metadata:', err);
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('appsLoaded', 'true');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleAppLaunch = (appId: string) => {
    try {
      const stored = localStorage.getItem('recent_apps_launched');
      let recents: string[] = stored ? JSON.parse(stored) : [];
      recents = [appId, ...recents.filter(id => id !== appId)].slice(0, 5);
      localStorage.setItem('recent_apps_launched', JSON.stringify(recents));
      setRecentApps(recents);
    } catch (err) {
      console.error(err);
    }
    onNavigate(appId);
  };

  const filteredApps = useMemo(() => {
    if (!searchQuery) return APPS;
    return APPS.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      CATEGORIES.some(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()) && cat.apps.includes(app.id))
    );
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

  const renderBadge = (appId: string) => {
    if (appId === 'whatsapp') {
      return (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-[9px] min-w-[15px] h-[15px] flex items-center justify-center rounded-full border border-zinc-950 shadow-md px-1 animate-bounce">
          3
        </span>
      );
    }
    if (appId === 'temp-mail') {
      return (
        <span className="absolute -top-1 -right-1 bg-indigo-500 text-white font-extrabold text-[8px] px-1 h-[15px] flex items-center justify-center rounded-full border border-zinc-950 shadow-md animate-pulse">
          NEW
        </span>
      );
    }
    if (appId === 'vpn' && isVpnConnected) {
      return (
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white font-extrabold text-[8px] px-1 h-[15px] flex items-center justify-center rounded-full border border-zinc-950 shadow-md">
          ON
        </span>
      );
    }
    if (appId === 'arena-ai') {
      return (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-950 font-black text-[7px] px-1 h-[14px] flex items-center justify-center rounded-full border border-zinc-950 shadow-md tracking-tighter">
          LIVE
        </span>
      );
    }
    return null;
  };

  const renderAppIcon = (app: any, idx: number, mode: 'normal' | 'library-large' | 'library-small' = 'normal') => {
    if (mode === 'library-large') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAppLaunch(app.id);
          }}
          className="w-full h-full flex flex-col items-center justify-center active:opacity-70 group relative"
        >
          <div className={`w-[85%] h-[85%] ${getIconShapeClass()} ${app.bg} flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95 relative overflow-visible`}>
            <app.icon className="w-1/2 h-1/2 text-white drop-shadow-md" strokeWidth={1.5} />
            {renderBadge(app.id)}
          </div>
          <span className="text-[9px] font-semibold text-white/50 truncate w-full mt-1 text-center select-none group-hover:text-white/85 transition-colors">{app.name}</span>
        </button>
      );
    }

    if (mode === 'library-small') {
      return (
        <div className={`w-full h-full ${getIconShapeClass()} ${app.bg} flex items-center justify-center shadow-sm relative`}>
          <app.icon className="w-1/2 h-1/2 text-white drop-shadow-sm" strokeWidth={1.5} />
          {renderBadge(app.id)}
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
              handleAppLaunch(app.id);
            }}
            className="flex flex-col items-center group w-full active:opacity-70 space-y-1.5 p-1 relative"
          >
            <div className={`${getIconSizeClass()} ${getIconShapeClass()} ${app.bg} flex items-center justify-center mx-auto ios-icon transition-all duration-300 group-hover:scale-105 group-active:scale-95 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.4)] relative`}>
              <app.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${app.color} drop-shadow-md relative z-10`} strokeWidth={1.5} />
              {renderBadge(app.id)}
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-white/90 truncate w-full text-center drop-shadow-md tracking-wide group-hover:text-white transition-colors">{app.name}</span>
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-black select-none">
      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar h-full w-full">
        <div className="max-w-5xl mx-auto relative px-6">
          
          {/* Header branding block */}
          <div className="flex flex-col items-center justify-center pt-10 pb-3 relative">
            <motion.span 
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="text-[10px] font-black tracking-[0.25em] text-indigo-400 uppercase"
            >
              ৡ RABBY EFTY ৡ
            </motion.span>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60 mt-1 tracking-tight">App Library</h1>
            <p className="text-[9px] font-mono font-extrabold text-white/30 tracking-widest uppercase mt-0.5">Smooth • Secure • Intelligent</p>
          </div>

          {/* Sticky Search Bar */}
          <div className="sticky top-0 z-40 pt-2 pb-4 bg-zinc-950/40 backdrop-blur-xl -mx-6 px-6 mb-4 border-b border-white/5">
            <div className="relative z-10">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search categories and apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 dark:bg-black/35 border border-white/10 rounded-2xl py-3 pl-12 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 backdrop-blur-xl shadow-lg transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Category Filters */}
          {!searchQuery && (
            <div className="flex gap-2 overflow-x-auto pb-5 pt-1 px-1 -mx-6 px-6 scrollbar-none snap-x select-none mb-2">
              {['All', ...CATEGORIES.map(c => c.name)].map((catName) => {
                const isActive = selectedFilter === catName;
                return (
                  <button
                    key={catName}
                    onClick={() => setSelectedFilter(catName)}
                    className={`snap-center shrink-0 px-4 py-2 text-[10px] font-black tracking-wider uppercase rounded-full border transition-all duration-300 ${
                      isActive 
                        ? 'bg-white text-zinc-950 border-white shadow-[0_8px_20px_rgba(255,255,255,0.12)] scale-[1.03] font-black' 
                        : 'bg-white/5 dark:bg-black/25 text-white/60 border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {catName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Result View */}
          {searchQuery ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-2 sm:gap-x-4 gap-y-6 content-start px-1 sm:px-2 pb-8">
              {filteredApps.map((app, idx) => renderAppIcon(app, idx, 'normal'))}
              {filteredApps.length === 0 && (
                <div className="col-span-full text-center py-16 text-white/40">
                  <p className="font-semibold text-sm">No workspace apps match your query.</p>
                  <p className="text-xs text-white/20 mt-1">Try typing short keywords like "VPN", "Weather", or "AI"</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Recent Apps Dock */}
              {selectedFilter === 'All' && recentApps.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 bg-gradient-to-br from-white/5 to-white/0 dark:from-zinc-900/20 dark:to-zinc-950/5 border border-white/10 rounded-[2rem] p-5 backdrop-blur-xl shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex justify-between items-center mb-4 px-1 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span className="text-[10px] font-black tracking-[0.18em] uppercase text-white/50">Frequent Channels</span>
                    </div>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('recent_apps_launched');
                        setRecentApps([]);
                      }}
                      className="text-[9px] font-black text-rose-450 hover:text-rose-400 transition-colors uppercase tracking-widest"
                    >
                      Reset Shelf
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-3 relative z-10">
                    {recentApps.map((appId) => {
                      const app = APPS.find(a => a.id === appId);
                      if (!app) return null;
                      return (
                        <button
                          key={appId}
                          onClick={() => handleAppLaunch(app.id)}
                          className="flex flex-col items-center group active:opacity-75 transition-all text-center"
                        >
                          <div className="w-13 h-13 rounded-[1.1rem] bg-zinc-900/50 border border-white/15 flex items-center justify-center p-[3px] shadow-lg group-hover:scale-105 group-hover:border-white/30 group-active:scale-95 transition-all duration-300 relative">
                            <div className={`w-full h-full rounded-[0.9rem] ${app.bg} flex items-center justify-center`}>
                              <app.icon className="w-5 h-5 text-white drop-shadow-md" strokeWidth={1.5} />
                            </div>
                            {renderBadge(app.id)}
                          </div>
                          <span className="text-[9px] font-bold text-white/80 mt-2 truncate w-full px-0.5 group-hover:text-white transition-colors">
                            {app.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Categorized Library Blocks */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
                {CATEGORIES.filter(cat => selectedFilter === 'All' || cat.name === selectedFilter).map((category, catIdx) => {
                  const categoryApps = category.apps.map(id => APPS.find(a => a.id === id)).filter(Boolean);
                  if (categoryApps.length === 0) return null;
                  
                  const isFilteredSingle = selectedFilter !== 'All';
                  const style = CATEGORIES_STYLING[category.name] || {
                    desc: `${categoryApps.length} Apps Ready`,
                    glow: "group-hover:from-white/5 group-hover:to-white/10",
                    border: "border-white/10",
                    highlight: "text-zinc-400"
                  };

                  if (isFilteredSingle) {
                    return (
                      <div key={category.name} className="col-span-full flex flex-col py-2">
                        <div className="flex flex-col text-left mb-6 px-1 border-l-2 border-indigo-500 pl-4 py-1">
                          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            {category.name}
                            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                          </h2>
                          <p className="text-[11px] font-mono text-white/45 uppercase tracking-wider mt-1">{style.desc} • ALL MODULES LIVE</p>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 px-1 pb-10">
                          {categoryApps.map((app, idx) => renderAppIcon(app, idx, 'normal'))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <motion.div 
                      key={category.name}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: catIdx * 0.05, type: 'spring', stiffness: 260, damping: 25 }}
                      className="flex flex-col group"
                    >
                      <div className="flex justify-between items-center px-4 mb-2">
                        <div className="flex flex-col text-left">
                          <span className="text-white font-extrabold text-[14px] tracking-wide group-hover:text-indigo-400 transition-colors">
                            {category.name}
                          </span>
                          <span className="text-[9px] font-mono tracking-widest text-white/35 uppercase mt-0.5">
                            {style.desc}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`relative bg-gradient-to-br from-white/5 to-white/0 dark:from-zinc-900/35 dark:to-zinc-950/15 border ${style.border} rounded-[2.2rem] p-4.5 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-black/70 aspect-square overflow-hidden flex items-center justify-center`}>
                        {/* Ambient dynamic glow background inside the folder card */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${style.glow}`} />
                        
                        <div className="grid grid-cols-2 gap-3.5 w-full h-full relative z-10">
                          {categoryApps[0] && <div className="w-full h-full">{renderAppIcon(categoryApps[0], 0, 'library-large')}</div>}
                          {categoryApps[1] && <div className="w-full h-full">{renderAppIcon(categoryApps[1], 1, 'library-large')}</div>}
                          {categoryApps[2] && <div className="w-full h-full">{renderAppIcon(categoryApps[2], 2, 'library-large')}</div>}
                          
                          {categoryApps.length > 4 ? (
                            <button 
                              onClick={() => setExpandedCategory(category.name)}
                              className="w-full h-full grid grid-cols-2 gap-2 p-2 bg-white/5 dark:bg-black/40 rounded-[1.4rem] border border-white/5 hover:border-white/10 active:opacity-75 group/btn transition-all duration-300 relative"
                            >
                              {categoryApps.slice(3, 7).map((app, i) => (
                                <div key={app?.id || i} className="w-full h-full transition-transform group-hover/btn:scale-105 duration-350">
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
            </>
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
            className="absolute inset-2 top-12 z-[60] bg-zinc-950/95 border border-white/10 rounded-[2.5rem] backdrop-blur-[55px] shadow-[0_32px_100px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-rose-500/5 pointer-events-none" />
            <div className="pb-6 pt-8 px-8 flex justify-between items-center border-b border-white/5 relative z-10">
              <div className="flex flex-col text-left">
                <span className="text-rose-400 font-extrabold text-[10px] tracking-[0.2em] uppercase">Sector folder</span>
                <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">{expandedCategory}</h2>
              </div>
              <button 
                onClick={() => setExpandedCategory(null)} 
                className="p-2.5 bg-white/5 hover:bg-white/10 active:scale-90 rounded-full text-white border border-white/5 transition-all shadow-md"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-8 pb-32 custom-scrollbar relative z-10">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-2 sm:gap-x-4 gap-y-7 content-start">
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

