import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { Home } from './components/Home';
import { Apps } from './components/Apps';
import { StatusBar } from './components/StatusBar';
import { UploadedFile, ChatMessage } from './types';
import { initChatSession, sendChatMessage, restoreChatHistory } from './services/gemini';
import { Menu, ChevronRight, Share, Battery, Wifi, Signal, Image as ImageIcon, Video, Mic, Sparkles, Shield, Globe, DownloadCloud, ThumbsUp, Smartphone, Home as HomeIcon, ArrowLeft, LogOut, User as UserIcon, Swords, Activity, Sun, Moon, CreditCard, Mail, Loader2, MessageCircle, Phone, Folder, LayoutGrid, Settings, Palette, TrendingUp, Calculator, StickyNote, CloudRain, Calendar, Map, Camera, Clock, Users, Music, Youtube, Bell, Search, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logout, onAuthStateChanged, User } from './firebase';
import { populateDummyData } from './lib/populate';
import { ThemeProvider, useTheme } from './ThemeContext';

import { Calculator as CalculatorApp } from './components/Calculator';
import { Notes as NotesApp } from './components/Notes';
import { Weather as WeatherApp } from './components/Weather';
import { Calendar as CalendarApp } from './components/Calendar';
import { Clock as ClockApp } from './components/Clock';
import { MapsApp } from './components/Map';
import { MusicApp } from './components/Music';

import { LockScreen } from './components/LockScreen';

const Chatbot = lazy(() => import('./components/Chatbot').then(m => ({ default: m.Chatbot })));
const VideoGenerator = lazy(() => import('./components/VideoGenerator').then(m => ({ default: m.VideoGenerator })));
const VoiceChat = lazy(() => import('./components/VoiceChat').then(m => ({ default: m.VoiceChat })));
const Vpn = lazy(() => import('./components/Vpn').then(m => ({ default: m.Vpn })));
const Browser = lazy(() => import('./components/Browser').then(m => ({ default: m.Browser })));
const Unblocker = lazy(() => import('./components/Unblocker').then(m => ({ default: m.Unblocker })));
const VideoDownloader = lazy(() => import('./components/VideoDownloader').then(m => ({ default: m.VideoDownloader })));
const FbAutoLike = lazy(() => import('./components/FbAutoLike').then(m => ({ default: m.FbAutoLike })));
const BuildApk = lazy(() => import('./components/BuildApk').then(m => ({ default: m.BuildApk })));
const ArenaAi = lazy(() => import('./components/ArenaAi').then(m => ({ default: m.ArenaAi })));
const CardGenerator = lazy(() => import('./components/CardGenerator').then(m => ({ default: m.CardGenerator })));
const TempMail = lazy(() => import('./components/TempMail').then(m => ({ default: m.TempMail })));
const TempNumber = lazy(() => import('./components/TempNumber').then(m => ({ default: m.TempNumber })));
const SystemStatus = lazy(() => import('./components/SystemStatus').then(m => ({ default: m.SystemStatus })));
const WhatsApp = lazy(() => import('./components/WhatsApp').then(m => ({ default: m.WhatsApp })));
const FileManager = lazy(() => import('./components/FileManager').then(m => ({ default: m.FileManager })));
const Gallery = lazy(() => import('./components/Gallery').then(m => ({ default: m.Gallery })));
const SettingsApp = lazy(() => import('./components/SettingsApp').then(m => ({ default: m.SettingsApp })));
const Followeran = lazy(() => import('./components/Followeran').then(m => ({ default: m.Followeran })));
const CameraApp = lazy(() => import('./components/CameraApp').then(m => ({ default: m.default })));
const ContactsApp = lazy(() => import('./components/ContactsApp').then(m => ({ default: m.default })));
const YouTubeApp = lazy(() => import('./components/YouTubeApp').then(m => ({ default: m.default })));
const AiSearch = lazy(() => import('./components/AiSearch').then(m => ({ default: m.AiSearch })));
const ImageGenerator = lazy(() => import('./components/ImageGenerator').then(m => ({ default: m.ImageGenerator })));

type Tab = 'home' | 'apps' | 'image' | 'video' | 'voice' | 'vpn' | 'browser' | 'unblocker' | 'downloader' | 'fb-autolike' | 'build-apk' | 'arena-ai' | 'status' | 'card-gen' | 'temp-mail' | 'temp-number' | 'whatsapp' | 'file-manager' | 'gallery' | 'settings' | 'followeran' | 'calculator' | 'notes' | 'weather' | 'calendar' | 'maps' | 'camera' | 'clock' | 'contacts' | 'music' | 'youtube' | 'ai-search';

export const APPS = [
  { id: 'ai-search', name: 'AI Search', icon: Search, color: 'text-orange-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'image', name: 'AI Image', icon: Wand2, color: 'text-purple-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'video', name: 'Video', icon: Video, color: 'text-pink-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'voice', name: 'Voice', icon: Mic, color: 'text-rose-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'vpn', name: 'VPN', icon: Shield, color: 'text-teal-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'browser', name: 'Browser', icon: Globe, color: 'text-blue-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'unblocker', name: 'Unblocker', icon: Shield, color: 'text-red-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'downloader', name: 'Downloader', icon: DownloadCloud, color: 'text-cyan-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'status', name: 'Status', icon: Activity, color: 'text-indigo-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'card-gen', name: 'Card Gen', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'arena-ai', name: 'Arena AI', icon: Swords, color: 'text-orange-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'fb-autolike', name: 'FB Liker', icon: ThumbsUp, color: 'text-blue-600', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'build-apk', name: 'APK Builder', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'temp-mail', name: 'Temp Mail', icon: Mail, color: 'text-violet-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'temp-number', name: 'Temp Number', icon: Phone, color: 'text-blue-600', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'file-manager', name: 'Files', icon: Folder, color: 'text-blue-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'gallery', name: 'Photos', icon: ImageIcon, color: 'text-purple-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'settings', name: 'Settings', icon: Palette, color: 'text-zinc-600', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'followeran', name: 'Followeran', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'calculator', name: 'Calculator', icon: Calculator, color: 'text-orange-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'notes', name: 'Notes', icon: StickyNote, color: 'text-yellow-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'weather', name: 'Weather', icon: CloudRain, color: 'text-blue-400', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, color: 'text-red-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'maps', name: 'Maps', icon: Map, color: 'text-green-600', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'camera', name: 'Camera', icon: Camera, color: 'text-zinc-800', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'clock', name: 'Clock', icon: Clock, color: 'text-black', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'contacts', name: 'Contacts', icon: Users, color: 'text-blue-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'music', name: 'Music', icon: Music, color: 'text-pink-500', bg: 'bg-gradient-to-br from-white to-gray-100' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600', bg: 'bg-gradient-to-br from-white to-gray-100' },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [history, setHistory] = useState<Tab[]>(['home']);
  const [forwardHistory, setForwardHistory] = useState<Tab[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const messages = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        restoreChatHistory(messages);
        return messages;
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isVpnConnected, setIsVpnConnected] = useState(false);

  const [isLocked, setIsLocked] = useState(true);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showSiri, setShowSiri] = useState(false);

  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState(false);
  const [dynamicIslandContent, setDynamicIslandContent] = useState<React.ReactNode>(null);
  const [notification, setNotification] = useState<{title: string; message: string; icon?: any; id: string} | null>(null);

  useEffect(() => {
    // Expose notification function globally
    (window as any).showNotification = (title: string, message: string, iconUrl?: string) => {
      const id = Date.now().toString();
      setNotification({ title, message, icon: iconUrl, id });
      setIsDynamicIslandExpanded(true);
      setTimeout(() => {
        setNotification((current) => current?.id === id ? null : current);
        setIsDynamicIslandExpanded(false);
      }, 4000);
    };
    
    // Notifications now triggered at unlock!
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const { iconShape, wallpaperUrl, setWallpaperUrl } = useTheme();

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    const loadWallpaper = async () => {
      const wallpaperId = localStorage.getItem('wallpaperId');
      if (wallpaperId) {
        import('./lib/vfs').then(async ({ getNode }) => {
          const node = await getNode(wallpaperId);
          if (node && node.data) {
            setWallpaperUrl(URL.createObjectURL(node.data));
          } else {
            // Node deleted or not found, reset wallpaper
            localStorage.removeItem('wallpaperId');
            setWallpaperUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop");
          }
        });
      }
    };
    loadWallpaper();

    const handleWallpaperChange = () => loadWallpaper();
    window.addEventListener('wallpaper-updated', handleWallpaperChange);
    return () => window.removeEventListener('wallpaper-updated', handleWallpaperChange);
  }, []);

  // Dynamic Island Auto-collapse
  useEffect(() => {
    if (isDynamicIslandExpanded) {
      const timer = setTimeout(() => setIsDynamicIslandExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isDynamicIslandExpanded]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    
    // Populate dummy data for File Manager and Gallery
    populateDummyData();
    
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user' && error?.message !== 'Firebase: Error (auth/popup-closed-by-user).') {
        console.error("Sign in failed:", error);
        alert("Sign in failed. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    localStorage.removeItem('chatHistory');
    initChatSession(files, null);
  };

  const handleFilesAdded = (newFiles: UploadedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const currentRequestRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = async (text: string) => {
    const requestId = Date.now();
    currentRequestRef.current = requestId;
    abortControllerRef.current = new AbortController();

    const userMsgId = Date.now().toString();
    const userMsg: ChatMessage = { 
      id: userMsgId,
      role: 'user', 
      text,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await sendChatMessage(text, abortControllerRef.current.signal);
      if (currentRequestRef.current !== requestId) return; // Aborted
      
      setChatMessages((prev) => {
        const updated = prev.map(msg => 
          msg.id === userMsgId ? { ...msg, status: 'read' as const } : msg
        );
        return [
          ...updated, 
          { 
            id: Date.now().toString(),
            role: 'model', 
            text: response.text,
            sources: response.sources,
            timestamp: new Date()
          }
        ];
      });
    } catch (error: any) {
      if (currentRequestRef.current !== requestId || error.message === 'Aborted') return; // Aborted
      
      console.error('Error sending message:', error);
      setChatMessages((prev) => {
        const updated = prev.map(msg => 
          msg.id === userMsgId ? { ...msg, status: 'read' as const } : msg
        );
        return [
          ...updated,
          { 
            id: Date.now().toString(),
            role: 'model', 
            text: 'Sorry, I encountered an error while processing your request.',
            timestamp: new Date()
          }
        ];
      });
    } finally {
      if (currentRequestRef.current === requestId) {
        setIsTyping(false);
      }
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    currentRequestRef.current = 0; // Invalidate current request
    setIsTyping(false);
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'model',
        text: '*Generation stopped by user.*',
        timestamp: new Date()
      }
    ]);
  };

  const handleNavigate = (tab: Tab) => {
    setActiveTab(tab);
    setHistory(prev => [...prev, tab]);
    setForwardHistory([]);
    if (tab !== 'home' && tab !== 'apps' && tab !== 'status') {
      const appInfo = APPS.find(a => a.id === tab);
      if (appInfo && (window as any).showNotification) {
        (window as any).showNotification(appInfo.name, "Application opened");
      }
    }
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      const currentTab = newHistory.pop()!; // Remove current
      const previousTab = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setActiveTab(previousTab);
      setForwardHistory(prev => [currentTab, ...prev]);
    }
  };

  const handleForward = () => {
    if (forwardHistory.length > 0) {
      const newForward = [...forwardHistory];
      const nextTab = newForward.shift()!;
      setForwardHistory(newForward);
      setHistory(prev => [...prev, nextTab]);
      setActiveTab(nextTab);
    }
  };
  
  const getIconShapeClass = () => {
    switch (iconShape) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-md';
      case 'squircle': default: return 'rounded-[1.4rem]';
    }
  };

  if (isLocked) {
    return (
      <LockScreen 
        wallpaperUrl={wallpaperUrl} 
        iconShape={iconShape} 
        onUnlock={() => {
          setIsLocked(false);
          if ((window as any).showNotification) {
             // Delay to allow unlock animation to finish
             setTimeout(() => {
                (window as any).showNotification("System Ready", "Welcome back, Rabby Efty");
             }, 600);
          }
        }} 
      />
    );
  }

  return (
    <motion.div 
      className={`flex flex-col h-full w-full overflow-hidden font-sans relative bg-transparent transition-all duration-700 ${theme === 'light' ? 'light text-zinc-900' : 'text-white'} ${isVpnConnected ? 'shadow-[inset_0_0_100px_rgba(34,197,94,0.15)]' : ''}`}
      onPanEnd={(e, info) => {
        const { offset, velocity, point } = info;
        const swipeThreshold = 50;
        const velocityThreshold = 500;
        const startX = point.x - offset.x;
        
        // Get container bounds
        const container = (e.target as HTMLElement).closest('.sm\\:max-w-\\[440px\\]');
        const containerRect = container ? container.getBoundingClientRect() : { left: 0, right: window.innerWidth };
        const relativeStartX = startX - containerRect.left;
        const containerWidth = containerRect.right - containerRect.left;

        // Check if it's mostly a horizontal swipe
        if (Math.abs(offset.x) > Math.abs(offset.y)) {
          if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
            // Swipe right (Back)
            // Only trigger if starting near the left edge
            if (relativeStartX < 50) {
              handleBack();
            }
          } else if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
            // Swipe left (Forward)
            // Only trigger if starting near the right edge
            if (relativeStartX > containerWidth - 50) {
              handleForward();
            }
          }
        }
      }}
    >
      {/* Wallpaper Background */}
      <div className="absolute inset-0 z-[-1] pointer-events-none">
        <img src={wallpaperUrl} alt="Wallpaper" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
      </div>

      {/* Control Center Swipe Area (Top Right) */}
      <div 
        className="absolute top-0 right-0 w-1/3 h-12 z-[110] cursor-pointer"
        onPointerDown={(e) => {
          // Simple swipe down detection
          const startY = e.clientY;
          const handlePointerUp = (upEvent: PointerEvent) => {
            if (upEvent.clientY - startY > 50) {
              setShowControlCenter(true);
            }
            window.removeEventListener('pointerup', handlePointerUp);
          };
          window.addEventListener('pointerup', handlePointerUp);
        }}
      />
      {/* VPN Secure Overlay */}
      <AnimatePresence>
        {isVpnConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Center */}
      <AnimatePresence>
        {showControlCenter && (
          <motion.div
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[120] bg-black/40 backdrop-blur-3xl p-6 pt-16 flex flex-col"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowControlCenter(false);
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.y < -50 || info.velocity.y < -500) {
                setShowControlCenter(false);
              }
            }}
          >
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
              {/* Connectivity */}
              <div className="bg-white/10 dark:bg-white/5 rounded-3xl p-4 grid grid-cols-2 gap-3 aspect-square backdrop-blur-md border border-white/10">
                <button className="flex flex-col items-center justify-center gap-1">
                  <div className={`w-12 h-12 ${getIconShapeClass()} bg-blue-500 flex items-center justify-center shadow-lg`}>
                    <Wifi className="w-5 h-5 text-white" />
                  </div>
                </button>
                <button className="flex flex-col items-center justify-center gap-1">
                  <div className={`w-12 h-12 ${getIconShapeClass()} bg-blue-500 flex items-center justify-center shadow-lg`}>
                    <Signal className="w-5 h-5 text-white" />
                  </div>
                </button>
                <button className="flex flex-col items-center justify-center gap-1">
                  <div className={`w-12 h-12 ${getIconShapeClass()} bg-white/20 flex items-center justify-center`}>
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                </button>
                <button 
                  onClick={() => setIsVpnConnected(!isVpnConnected)}
                  className="flex flex-col items-center justify-center gap-1"
                >
                  <div className={`w-12 h-12 ${getIconShapeClass()} flex items-center justify-center shadow-lg transition-colors ${isVpnConnected ? 'bg-green-500' : 'bg-white/20'}`}>
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                </button>
              </div>

              {/* Media Controls */}
              <div className="bg-white/10 dark:bg-white/5 rounded-3xl p-4 flex flex-col justify-between aspect-square backdrop-blur-md border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-xs font-medium">Not Playing</span>
                  <div className={`w-5 h-5 ${getIconShapeClass()} bg-white/20 flex items-center justify-center`}>
                    <Signal className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <div className={`w-8 h-8 ${getIconShapeClass()} bg-white/10 flex items-center justify-center`}><ChevronRight className="w-4 h-4 rotate-180 text-white" /></div>
                  <div className={`w-10 h-10 ${getIconShapeClass()} bg-white/20 flex items-center justify-center`}><div className="w-3 h-3 bg-white" /></div>
                  <div className={`w-8 h-8 ${getIconShapeClass()} bg-white/10 flex items-center justify-center`}><ChevronRight className="w-4 h-4 text-white" /></div>
                </div>
              </div>

              {/* Brightness & Volume */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-white/10 dark:bg-white/5 rounded-3xl h-32 relative flex flex-col justify-end p-4 backdrop-blur-md border border-white/10 overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-white/20" />
                  <Sun className="w-6 h-6 text-white relative z-10" />
                </div>
                <div className="bg-white/10 dark:bg-white/5 rounded-3xl h-32 relative flex flex-col justify-end p-4 backdrop-blur-md border border-white/10 overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white/20" />
                  <div className="w-6 h-6 relative z-10 flex items-end justify-center">
                    <div className="w-1 h-3 bg-white rounded-full mx-0.5" />
                    <div className="w-1 h-4 bg-white rounded-full mx-0.5" />
                    <div className="w-1 h-5 bg-white rounded-full mx-0.5" />
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="col-span-2 bg-white/10 dark:bg-white/5 rounded-3xl p-4 flex items-center justify-between backdrop-blur-md border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${getIconShapeClass()} flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500' : 'bg-orange-400'}`}>
                    {theme === 'dark' ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
                  </div>
                  <span className="text-white font-medium">Dark Mode</span>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-green-500' : 'bg-white/20'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
            
            <div className="mt-auto flex justify-center pb-8">
              <button 
                onClick={() => setShowControlCenter(false)}
                className="w-12 h-1.5 bg-white/50 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Siri-like AI Overlay */}
      <AnimatePresence>
        {showSiri && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[130] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-end pb-20"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSiri(false);
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.1 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 50 || info.velocity.y > 500) {
                setShowSiri(false);
              }
            }}
          >
            <div className="text-center mb-12 px-8">
              <h2 className="text-2xl font-medium text-white/90 mb-2">How can I help?</h2>
              <p className="text-white/50 text-sm">Try asking "Generate an image of a cat" or "What's the weather?"</p>
            </div>
            
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 90, 180, 270, 360]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-80"
            />
            <div className="absolute bottom-20 w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 mix-blend-screen shadow-[0_0_50px_rgba(168,85,247,0.5)] flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <button 
              onClick={() => {
                setShowSiri(false);
                handleNavigate('voice');
              }}
              className="mt-16 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/10 text-white font-medium transition-colors"
            >
              Open Voice Chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Island */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto flex flex-col items-center">
        <motion.div 
          layout
          onClick={(e) => {
            if (e.detail === 3) {
              setIsLocked(true);
              setIsDynamicIslandExpanded(false);
              return;
            }

            // Prevent expanding if clicking the back button
            if ((e.target as HTMLElement).closest('.back-btn')) return;
            
            if (e.detail === 1) {
              if (isDynamicIslandExpanded) {
                handleNavigate('status');
                setIsDynamicIslandExpanded(false);
              } else {
                setIsDynamicIslandExpanded(true);
              }
            }
          }}
          className={`dynamic-island liquid-glass ${isDynamicIslandExpanded ? 'w-72 h-20' : (activeTab !== 'home' ? 'w-[140px]' : 'w-[126px]')} h-[36px] cursor-pointer ios-shadow relative`}
        >
          <AnimatePresence mode="wait">
            {!isDynamicIslandExpanded ? (
              <motion.div 
                key="pill"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2 w-full h-full justify-between px-4"
              >
                {activeTab !== 'home' ? (
                  <button 
                    onClick={handleBack}
                    className="back-btn flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-75 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="expanded"
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="w-full h-full flex items-center justify-between px-5"
              >
                {notification ? (
                  <div className="flex items-center space-x-4 w-full">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      {notification.icon ? <img src={notification.icon} className="w-6 h-6 rounded-full" /> : <Bell className="w-5 h-5"/>}
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-white font-bold text-sm truncate">{notification.title}</span>
                      <span className="text-white/60 text-xs truncate">{notification.message}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 ${getIconShapeClass()} flex items-center justify-center shadow-lg border border-white/20`}>
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">꧁Rᴀʙʙʏ Eғᴛʏ꧂</span>
                        <span className="text-sm font-bold text-white tracking-tight">System Active</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-2 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <span className="text-[9px] font-black text-green-400 tracking-widest uppercase">Secure</span>
                      </div>
                      <span className="text-[9px] text-white/30 font-medium tracking-tighter">v17.0.1 PRO</span>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className={`mt-2 text-xs font-bold tracking-widest uppercase ${theme === 'light' ? 'text-zinc-400' : 'text-white/40'}`}
        >
          ꧁Rᴀʙʙʏ Eғᴛʏ꧂
        </motion.div>
      </div>

      {/* iOS Status Bar */}
      <StatusBar theme={theme} isVpnConnected={isVpnConnected} />

      {/* Top Navigation Bar - Removed for iOS look */}
      
      {/* Sidebar - Removed for iOS look */}

      {/* Main Content */}
      <div className={`flex flex-1 overflow-hidden relative z-10 ${activeTab !== 'home' && activeTab !== 'apps' ? 'pt-0 pb-0' : ''}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full w-full will-change-transform"
            >
              <Home 
                onNavigate={handleNavigate} 
                recentApps={Array.from(new Set([...history].reverse())).filter(id => id !== 'home' && id !== 'apps' && id !== 'status').map(id => APPS.find(app => app.id === id)).filter(Boolean)}
              />
            </motion.div>
          ) : activeTab === 'apps' ? (
            <motion.div
              key="apps"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full w-full will-change-transform"
            >
              <Apps onNavigate={handleNavigate} isVpnConnected={isVpnConnected} setIsVpnConnected={setIsVpnConnected} />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.8 }}
              className="h-full w-full bg-black/40 backdrop-blur-xl overflow-hidden flex flex-col will-change-transform"
            >
              <div className="flex-1 overflow-y-auto relative">
                <Suspense fallback={
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-col items-center justify-center h-full gap-3"
                  >
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
                      <Loader2 className="w-8 h-8 text-white/50" />
                    </motion.div>
                    <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="text-white/40 text-[11px] font-medium tracking-widest uppercase">
                      Loading
                    </motion.p>
                  </motion.div>
                }>
                  {activeTab === 'image' && <ImageGenerator isVpnConnected={isVpnConnected} onBack={handleBack} />}
                  {activeTab === 'video' && <VideoGenerator isVpnConnected={isVpnConnected} onBack={handleBack} />}
                  {activeTab === 'voice' && <VoiceChat isVpnConnected={isVpnConnected} onBack={handleBack} />}
                  {activeTab === 'vpn' && <Vpn isConnected={isVpnConnected} setIsConnected={setIsVpnConnected} onBack={handleBack} />}
                  {activeTab === 'browser' && <Browser isVpnConnected={isVpnConnected} setIsVpnConnected={setIsVpnConnected} onBack={handleBack} />}
                  {activeTab === 'unblocker' && <Unblocker onBack={handleBack} onNavigateToBrowser={(url) => {
                    handleNavigate('browser');
                    localStorage.setItem('browser_home_url', url);
                    localStorage.setItem('browser_use_proxy', 'true');
                  }} />}
                  {activeTab === 'downloader' && <VideoDownloader isVpnConnected={isVpnConnected} onBack={handleBack} />}
                  {activeTab === 'fb-autolike' && <FbAutoLike isVpnConnected={isVpnConnected} onBack={handleBack} />}
                  {activeTab === 'build-apk' && <BuildApk isVpnConnected={isVpnConnected} onBack={handleBack} />}
                  {activeTab === 'arena-ai' && <ArenaAi isVpnConnected={isVpnConnected} onBack={handleBack} />}
                  {activeTab === 'ai-search' && <AiSearch onBack={handleBack} />}
                  {activeTab === 'card-gen' && <CardGenerator isVpnConnected={isVpnConnected} onBack={handleBack} />}
                  {activeTab === 'temp-mail' && <TempMail isVpnConnected={isVpnConnected} onBack={handleBack} />}
                  {activeTab === 'temp-number' && <TempNumber isVpnConnected={isVpnConnected} onBack={handleBack} />}
                  {activeTab === 'whatsapp' && <WhatsApp onBack={handleBack} />}
                  {activeTab === 'file-manager' && <FileManager onBack={handleBack} />}
                  {activeTab === 'gallery' && <Gallery onBack={handleBack} />}
                  {activeTab === 'settings' && <SettingsApp onBack={handleBack} />}
                  {activeTab === 'followeran' && <Followeran onBack={handleBack} />}
                  {activeTab === 'youtube' && <YouTubeApp onBack={handleBack} />}
                  {activeTab === 'calculator' && <CalculatorApp onBack={handleBack} />}
                  {activeTab === 'notes' && <NotesApp onBack={handleBack} />}
                  {activeTab === 'weather' && <WeatherApp onBack={handleBack} />}
                  {activeTab === 'calendar' && <CalendarApp onBack={handleBack} />}
                  {activeTab === 'clock' && <ClockApp onBack={handleBack} />}
                  {activeTab === 'music' && <MusicApp onBack={handleBack} />}
                  {activeTab === 'maps' && <MapsApp onBack={handleBack} />}
                  {activeTab === 'camera' && <CameraApp onClose={() => handleNavigate('home')} />}
                  {activeTab === 'contacts' && <ContactsApp onBack={handleBack} />}
                  {activeTab === 'status' && <SystemStatus 
                    isVpnConnected={isVpnConnected} 
                    theme={theme}
                    setTheme={setTheme}
                    user={user}
                    isAuthLoading={isAuthLoading}
                    handleSignIn={handleSignIn}
                    handleLogout={handleLogout}
                    onBack={handleBack}
                  />}
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chatbot (hidden in voice tab, home, and browser) */}
      {activeTab !== 'voice' && activeTab !== 'home' && activeTab !== 'browser' && (
        <Suspense fallback={null}>
          <Chatbot
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onStopGeneration={handleStopGeneration}
            isTyping={isTyping}
          />
        </Suspense>
      )}

      {/* Bottom Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center justify-end pb-6">
        <AnimatePresence>
          {(activeTab === 'home' || activeTab === 'apps' || activeTab === 'ai-search' || activeTab === 'status' || activeTab === 'settings') && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="max-w-[320px] sm:max-w-md w-full mx-auto glass-dock liquid-glass p-3.5 flex justify-around items-center pointer-events-auto ios-shadow rounded-[2.5rem] border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.5)] backdrop-blur-2xl mb-4"
            >
              <motion.button 
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavigate('home')}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                <HomeIcon className="w-6 h-6" />
                <span className="text-[10px] font-medium">Home</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavigate('apps')}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'apps' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                <LayoutGrid className="w-6 h-6" />
                <span className="text-[10px] font-medium">Apps</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavigate('ai-search')}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'ai-search' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                <Search className="w-6 h-6" />
                <span className="text-[10px] font-medium">AI Search</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavigate('settings')}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                <Settings className="w-6 h-6" />
                <span className="text-[10px] font-medium">Settings</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Home Indicator */}
        <motion.div 
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.y < -30) {
              handleNavigate('home');
            } else if (info.offset.x > 50) {
              handleBack();
            } else if (info.offset.x < -50) {
              handleForward();
            }
          }}
          onPointerDown={() => {
            const timer = setTimeout(() => {
              setShowSiri(true);
            }, 500);
            // @ts-ignore
            window.__siriTimer = timer;
          }}
          onPointerUp={() => {
            // @ts-ignore
            clearTimeout(window.__siriTimer);
          }}
          onPointerCancel={() => {
            // @ts-ignore
            clearTimeout(window.__siriTimer);
          }}
          onClick={() => handleNavigate('home')}
          className={`w-36 h-1.5 rounded-full pointer-events-auto cursor-pointer hover:scale-110 transition-transform ${theme === 'light' ? 'bg-zinc-800/30 hover:bg-zinc-800/50' : 'bg-white/40 hover:bg-white/60'}`} 
        />
      </div>
    </motion.div>
  );
}

function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      if (cursorRef.current) {
        const target = e.target as HTMLElement;
        const isClickable = 
          target.tagName.toLowerCase() === 'button' || 
          target.tagName.toLowerCase() === 'a' || 
          target.tagName.toLowerCase() === 'input' || 
          target.tagName.toLowerCase() === 'textarea' || 
          target.closest('button') || 
          target.closest('a') ||
          target.closest('.cursor-pointer');

        const scale = isClickable ? 'scale(1.5)' : 'scale(1)';
        const bg = isClickable ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';

        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) ${scale}`;
        cursorRef.current.style.background = bg;
      }
    };

    window.addEventListener('mousemove', updatePosition);
    return () => window.removeEventListener('mousemove', updatePosition);
  }, []);

  return (
    <>
      <style>{`
        @media (min-width: 640px) {
          * {
            cursor: none !important;
          }
        }
      `}</style>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[99999] hidden sm:flex items-center justify-center"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
          transition: 'transform 0.1s ease-out, background 0.2s ease-out',
        }}
      >
        <div className="w-1.5 h-1.5 bg-white/60 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CustomCursor />
      <div className="w-full h-[100dvh] bg-black sm:py-4 flex items-center justify-center overflow-hidden">
        <div className="w-full h-full sm:max-w-[440px] sm:max-h-[956px] sm:rounded-[3rem] sm:border-[8px] sm:border-zinc-900 overflow-hidden relative shadow-2xl bg-[#000]">
          <AppContent />
        </div>
      </div>
    </ThemeProvider>
  );
}
