import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, ShieldCheck, ExternalLink, Globe, AlertCircle, Star, Bookmark, Trash2, X, Settings, Plus, Shield, Search, Menu, MoreVertical, ShieldAlert, RefreshCw, Triangle, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processAiWebSearch } from '../services/gemini';
import Markdown from 'react-markdown';

interface BrowserProps {
  isVpnConnected: boolean;
  setIsVpnConnected: (connected: boolean) => void;
  onBack?: () => void;
}

interface BrowserTab {
  id: string;
  url: string | null;
  inputUrl: string;
  history: string[];
  historyIndex: number;
  title: string;
  lastAccessed: number;
  isSuspended: boolean;
  isLoading: boolean;
  loadError: boolean;
  aiSummary?: string | null;
  aiSources?: { title: string; uri: string }[] | null;
  isAiLoading?: boolean;
  aiQuery?: string | null;
}

export function Browser({ isVpnConnected, setIsVpnConnected, onBack }: BrowserProps) {
  const [homeUrl, setHomeUrl] = useState(() => {
    return localStorage.getItem('browser_home_url') || 'https://www.google.com/search?igu=1';
  });
  
  const [tabs, setTabs] = useState<BrowserTab[]>([{
    id: 'tab-' + Date.now(),
    url: homeUrl,
    inputUrl: homeUrl.replace('https://', '').replace('http://', ''),
    history: [homeUrl],
    historyIndex: 0,
    title: 'New Tab',
    lastAccessed: Date.now(),
    isSuspended: false,
    isLoading: true,
    loadError: false
  }]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [useProxy, setUseProxy] = useState(() => {
    return localStorage.getItem('browser_use_proxy') === 'true';
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTabSwitcher, setShowTabSwitcher] = useState(false);
  const [showShields, setShowShields] = useState(false);
  const [shieldsUp, setShieldsUp] = useState(true);
  const [trackersBlocked, setTrackersBlocked] = useState(Math.floor(Math.random() * 50) + 10);
  const [tempHomeUrl, setTempHomeUrl] = useState(homeUrl);
  const [bookmarks, setBookmarks] = useState<{url: string, title: string}[]>(() => {
    const saved = localStorage.getItem('browser_bookmarks');
    return saved ? JSON.parse(saved) : [
      { url: 'https://www.google.com/search?igu=1', title: 'Google' },
      { url: 'https://duckduckgo.com', title: 'DuckDuckGo' }
    ];
  });

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    localStorage.setItem('browser_use_proxy', useProxy.toString());
  }, [useProxy]);

  useEffect(() => {
    localStorage.setItem('browser_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Tab suspension logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTabs(prevTabs => prevTabs.map(tab => {
        if (tab.id !== activeTabId && !tab.isSuspended && (now - tab.lastAccessed > 300000)) {
          return { ...tab, isSuspended: true };
        }
        return tab;
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, [activeTabId]);

  const updateActiveTab = (updates: Partial<BrowserTab>) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const updateTab = (id: string, updates: Partial<BrowserTab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addTab = () => {
    const newTab: BrowserTab = {
      id: 'tab-' + Date.now(),
      url: homeUrl,
      inputUrl: homeUrl.replace('https://', '').replace('http://', ''),
      history: [homeUrl],
      historyIndex: 0,
      title: 'New Tab',
      lastAccessed: Date.now(),
      isSuspended: false,
      isLoading: true,
      loadError: false
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setShowTabSwitcher(false);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) {
      updateTab(id, {
        url: homeUrl,
        inputUrl: homeUrl.replace('https://', '').replace('http://', ''),
        history: [homeUrl],
        historyIndex: 0,
        title: 'New Tab',
        isLoading: true,
        loadError: false
      });
      setShowTabSwitcher(false);
      return;
    }
    
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const currentBaseUrl = activeTab.history[activeTab.historyIndex];
  const isBookmarked = bookmarks.some(b => b.url === currentBaseUrl);

  const toggleBookmark = () => {
    if (isBookmarked) {
      setBookmarks(bookmarks.filter(b => b.url !== currentBaseUrl));
    } else {
      let title = activeTab.inputUrl;
      try {
        const urlObj = new URL(currentBaseUrl.startsWith('http') ? currentBaseUrl : `https://${currentBaseUrl}`);
        title = urlObj.hostname.replace('www.', '');
      } catch (e) {}
      setBookmarks([...bookmarks, { url: currentBaseUrl, title }]);
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (activeTab.isLoading) {
      timeout = setTimeout(() => {
        updateActiveTab({ isLoading: false, loadError: true });
      }, 15000);
    }
    return () => clearTimeout(timeout);
  }, [activeTab.isLoading, activeTabId]);

  const getEffectiveUrl = (targetUrl: string, proxyEnabled: boolean) => {
    if (proxyEnabled && !targetUrl.includes('google.com/search?igu=1') && !targetUrl.includes('google.com')) {
      // Use a proxy that strips X-Frame-Options and bypasses CORS
      return `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    }
    if (targetUrl.includes('google.com') && !targetUrl.includes('igu=1')) {
      return targetUrl.includes('?') ? `${targetUrl}&igu=1` : `${targetUrl}?igu=1`;
    }
    return targetUrl;
  };

  const navigateTo = (newUrl: string) => {
    let finalUrl = newUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        finalUrl = 'https://www.google.com/search?igu=1&q=' + encodeURIComponent(finalUrl);
      }
    }

    const effectiveUrl = getEffectiveUrl(finalUrl, useProxy);
    
    let title = finalUrl.replace('https://', '').replace('http://', '');
    try {
      const urlObj = new URL(finalUrl);
      title = urlObj.hostname.replace('www.', '');
    } catch (e) {}

    const newHistory = activeTab.history.slice(0, activeTab.historyIndex + 1);
    newHistory.push(finalUrl);

    updateActiveTab({
      url: effectiveUrl,
      inputUrl: finalUrl.replace('https://', '').replace('http://', ''),
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isLoading: true,
      loadError: false,
      title: title,
      isSuspended: false,
      lastAccessed: Date.now()
    });
    
    // Simulate trackers blocked
    if (shieldsUp) {
      setTimeout(() => setTrackersBlocked(prev => prev + Math.floor(Math.random() * 5)), 2000);
    }
  };

  const handleAiSearch = async () => {
    if (!activeTab.inputUrl.trim()) return;
    
    updateActiveTab({ 
      isAiLoading: true, 
      aiSummary: null, 
      aiSources: null,
      aiQuery: activeTab.inputUrl 
    });

    try {
      const response = await processAiWebSearch(activeTab.inputUrl);
      updateActiveTab({ 
        aiSummary: response.text, 
        aiSources: response.sources.length > 0 ? response.sources : null
      });
    } catch (e: any) {
      updateActiveTab({ aiSummary: `*Error:* ${e.message}` });
    } finally {
      updateActiveTab({ isAiLoading: false });
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab.inputUrl.startsWith('ai:')) {
      updateActiveTab({ inputUrl: activeTab.inputUrl.substring(3).trim() });
      setTimeout(handleAiSearch, 10);
      return;
    }
    navigateTo(activeTab.inputUrl);
  };

  const goBack = () => {
    if (activeTab.historyIndex > 0) {
      const prevUrl = activeTab.history[activeTab.historyIndex - 1];
      const effectiveUrl = getEffectiveUrl(prevUrl, useProxy);
      
      let title = prevUrl.replace('https://', '').replace('http://', '');
      try {
        const urlObj = new URL(prevUrl);
        title = urlObj.hostname.replace('www.', '');
      } catch (e) {}

      updateActiveTab({
        historyIndex: activeTab.historyIndex - 1,
        url: effectiveUrl,
        inputUrl: prevUrl.replace('https://', '').replace('http://', ''),
        isLoading: true,
        loadError: false,
        title: title,
        isSuspended: false,
        lastAccessed: Date.now()
      });
    }
  };

  const goForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const nextUrl = activeTab.history[activeTab.historyIndex + 1];
      const effectiveUrl = getEffectiveUrl(nextUrl, useProxy);
      
      let title = nextUrl.replace('https://', '').replace('http://', '');
      try {
        const urlObj = new URL(nextUrl);
        title = urlObj.hostname.replace('www.', '');
      } catch (e) {}

      updateActiveTab({
        historyIndex: activeTab.historyIndex + 1,
        url: effectiveUrl,
        inputUrl: nextUrl.replace('https://', '').replace('http://', ''),
        isLoading: true,
        loadError: false,
        title: title,
        isSuspended: false,
        lastAccessed: Date.now()
      });
    }
  };

  const openExternal = () => {
    const actualUrl = activeTab.history[activeTab.historyIndex];
    window.open(actualUrl, '_blank');
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full relative z-10 bg-zinc-100 overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      <div 
        className="absolute inset-y-0 left-0 w-4 z-50"
        onPointerDown={(e) => {
          const startX = e.clientX;
          const handlePointerUp = (upEvent: PointerEvent) => {
            if (upEvent.clientX - startX > 50) {
              if (onBack) onBack();
            }
            window.removeEventListener('pointerup', handlePointerUp);
          };
          window.addEventListener('pointerup', handlePointerUp);
        }}
      />

      {/* Tab Switcher View */}
      <AnimatePresence>
        {showTabSwitcher && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-zinc-900 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 pt-safe">
              <button onClick={() => setShowTabSwitcher(false)} className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white font-medium">Tabs</h2>
              <button onClick={addTab} className="text-zinc-400 hover:text-white">
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 content-start">
              {tabs.map(tab => (
                <div 
                  key={tab.id} 
                  className={`bg-zinc-800 rounded-xl overflow-hidden flex flex-col border-2 transition-colors ${activeTabId === tab.id ? 'border-orange-500' : 'border-transparent'}`}
                >
                  <div className="flex items-center justify-between p-2 bg-zinc-800/80 border-b border-zinc-700">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="text-xs text-zinc-300 truncate">{tab.title}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="text-zinc-400 hover:text-white p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div 
                    className="h-32 bg-white cursor-pointer relative"
                    onClick={() => {
                      setActiveTabId(tab.id);
                      updateTab(tab.id, { lastAccessed: Date.now() });
                      setShowTabSwitcher(false);
                    }}
                  >
                    {/* Simplified preview */}
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                      <span className="text-zinc-400 text-sm font-medium truncate px-4">{tab.inputUrl}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-center pb-safe">
              <button onClick={addTab} className="flex items-center space-x-2 text-white bg-zinc-800 px-6 py-3 rounded-full font-medium hover:bg-zinc-700 transition-colors">
                <Plus className="w-5 h-5" />
                <span>New Tab</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar (Brave Style) */}
      <div className="bg-white border-b border-zinc-200 px-3 py-2 flex items-center gap-3 shadow-sm z-20 pt-safe">
        <button 
          onClick={() => setShowShields(true)} 
          className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
        >
          {shieldsUp ? <ShieldCheck className="w-6 h-6 text-orange-500" /> : <Shield className="w-6 h-6 text-zinc-400" />}
        </button>
        
        <form onSubmit={handleNavigate} className="flex-1 flex items-center bg-zinc-100/80 rounded-full px-4 py-2.5 border border-transparent focus-within:border-orange-500/30 focus-within:bg-white focus-within:shadow-sm transition-all">
          <Lock className="w-3.5 h-3.5 text-zinc-500 mr-2 shrink-0" />
          <input 
            type="text" 
            value={activeTab.inputUrl}
            onChange={(e) => updateActiveTab({ inputUrl: e.target.value })}
            className="flex-1 bg-transparent text-[15px] outline-none text-zinc-900 placeholder:text-zinc-400 min-w-0"
            placeholder="Search or ask AI..."
          />
          {activeTab.isLoading ? (
            <RotateCw className="w-4 h-4 text-zinc-400 animate-spin shrink-0 ml-2" />
          ) : (
            <div className="flex items-center shrink-0 ml-1">
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); handleAiSearch(); }} 
                className="p-1 hover:bg-orange-100 rounded-full text-orange-500 mr-1 transition-colors" 
                title="Ask AI"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => {
                updateActiveTab({ isLoading: true, loadError: false, isSuspended: false });
                const currentUrl = activeTab.url;
                updateActiveTab({ url: null });
                setTimeout(() => updateActiveTab({ url: currentUrl }), 10);
              }} className="p-1 hover:bg-zinc-200 rounded-full transition-colors">
                <RefreshCw className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          )}
        </form>
        
        <button className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors">
          <Triangle className="w-6 h-6 text-red-500 fill-red-500" />
        </button>
      </div>

      {/* Shields Dropdown/Modal */}
      <AnimatePresence>
        {showShields && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 z-30"
              onClick={() => setShowShields(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-16 left-2 right-2 md:left-4 md:w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden z-40"
            >
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className={`w-5 h-5 ${shieldsUp ? 'text-orange-500' : 'text-zinc-400'}`} />
                  <h3 className="font-bold text-zinc-800">Brave Shields</h3>
                </div>
                <button 
                  onClick={() => setShieldsUp(!shieldsUp)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shieldsUp ? 'bg-orange-500' : 'bg-zinc-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shieldsUp ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="p-4 bg-zinc-50/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-zinc-600">Trackers & ads blocked</span>
                  <span className="font-bold text-zinc-800">{shieldsUp ? trackersBlocked : 0}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-zinc-600">Bandwidth saved</span>
                  <span className="font-bold text-zinc-800">{shieldsUp ? (trackersBlocked * 0.15).toFixed(1) : 0} MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Time saved</span>
                  <span className="font-bold text-zinc-800">{shieldsUp ? Math.floor(trackersBlocked * 1.2) : 0}s</span>
                </div>
              </div>
              <div className="p-3 border-t border-zinc-100 bg-white flex justify-between">
                <button onClick={() => setUseProxy(!useProxy)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  {useProxy ? 'Disable Proxy' : 'Enable Proxy'}
                </button>
                <button onClick={() => setShowSettings(true)} className="text-xs font-medium text-zinc-600 hover:text-zinc-800">
                  Advanced Controls
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 z-30"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden z-40"
            >
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="font-bold text-zinc-800">Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Home Page URL</label>
                  <input 
                    type="text" 
                    value={tempHomeUrl}
                    onChange={(e) => setTempHomeUrl(e.target.value)}
                    className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-zinc-700">VPN Secure Browsing</span>
                  <button 
                    onClick={() => setIsVpnConnected(!isVpnConnected)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isVpnConnected ? 'bg-green-500' : 'bg-zinc-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isVpnConnected ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <button 
                  onClick={() => {
                    let finalUrl = tempHomeUrl.trim();
                    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                      finalUrl = 'https://' + finalUrl;
                    }
                    setHomeUrl(finalUrl);
                    localStorage.setItem('browser_home_url', finalUrl);
                    setShowSettings(false);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-bold transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Browser Content */}
      <div className="flex-1 bg-white relative pb-0">
        {tabs.map(tab => (
          <div key={tab.id} className={`w-full h-full absolute inset-0 ${activeTabId === tab.id ? 'z-10' : 'z-0 hidden'}`}>
            {tab.isLoading && activeTabId === tab.id && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
              </div>
            )}

            {tab.loadError && !tab.isLoading && activeTabId === tab.id && (
              <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Site can't be reached</h3>
                <p className="text-sm text-zinc-500 mb-6 max-w-xs">
                  The connection was reset or the site is blocking iframe embedding.
                </p>
                <div className="flex flex-col w-full max-w-xs space-y-3">
                  <button 
                    onClick={() => {
                      updateTab(tab.id, { isLoading: true, loadError: false });
                      const currentUrl = tab.url;
                      updateTab(tab.id, { url: null });
                      setTimeout(() => updateTab(tab.id, { url: currentUrl }), 10);
                    }}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                  >
                    Reload
                  </button>
                  <button 
                    onClick={() => {
                      setUseProxy(!useProxy);
                      const currentBaseUrl = tab.history[tab.historyIndex];
                      navigateTo(currentBaseUrl);
                    }}
                    className="w-full py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                  >
                    {useProxy ? 'Disable Proxy' : 'Enable Proxy Mode'}
                  </button>
                  <button 
                    onClick={openExternal}
                    className="text-sm text-orange-600 font-bold hover:underline py-2 flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in external app
                  </button>
                </div>
              </div>
            )}
            
            <AnimatePresence>
              {(tab.isAiLoading || tab.aiSummary) && activeTabId === tab.id && (
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute bottom-0 left-0 right-0 max-h-[80%] bg-white/90 backdrop-blur-xl z-30 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white overflow-hidden flex flex-col"
                >
                  <div className="flex flex-col bg-gradient-to-r from-orange-100/50 to-orange-50/50 p-4 border-b border-orange-100/50 shrink-0">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                           <Sparkles className="w-4 h-4 text-white" />
                         </div>
                         <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                           AI Summary
                           {tab.isAiLoading && <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />}
                         </h3>
                       </div>
                       <motion.button 
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                         onClick={() => updateActiveTab({ aiSummary: null, isAiLoading: false, aiSources: null })}
                         className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
                       >
                         <X className="w-5 h-5 text-zinc-500" />
                       </motion.button>
                     </div>
                     {tab.aiQuery && (
                       <p className="mt-2 text-sm text-zinc-500 font-medium px-1 line-clamp-1 flex items-center gap-2">
                         <Search className="w-3.5 h-3.5" />
                         "{tab.aiQuery}"
                       </p>
                     )}
                  </div>
                  
                  <div className="p-5 overflow-y-auto flex-1 overscroll-contain">
                    {tab.isAiLoading && !tab.aiSummary ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-zinc-400 animate-pulse">Generating summary...</p>
                      </div>
                    ) : tab.aiSummary ? (
                      <div className="prose prose-sm max-w-none text-zinc-700 prose-headings:text-zinc-800 prose-a:text-orange-600">
                        <Markdown>{tab.aiSummary}</Markdown>
                        
                        {tab.aiSources && tab.aiSources.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-zinc-100">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Sources</h4>
                            <div className="flex flex-wrap gap-2">
                              {tab.aiSources.map((source, i) => (
                                <motion.button 
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.96 }}
                                  key={i}
                                  onClick={() => {
                                    updateActiveTab({ aiSummary: null, isAiLoading: false, aiSources: null });
                                    navigateTo(source.uri);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-orange-50 rounded-lg text-xs font-medium text-zinc-600 hover:text-orange-600 transition-colors max-w-full shadow-sm"
                                >
                                  <Globe className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{source.title || source.uri}</span>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!tab.isSuspended ? (
              <iframe 
                src={tab.url || undefined} 
                loading={activeTabId === tab.id ? "eager" : "lazy"}
                className="w-full h-full border-none bg-white"
                title={`Browser View ${tab.id}`}
                onLoad={() => updateTab(tab.id, { isLoading: false, loadError: false })}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
                <Globe className="w-16 h-16 text-zinc-300 mb-4" />
                <h3 className="text-xl font-bold text-zinc-700 mb-2">Tab Suspended</h3>
                <p className="text-sm text-zinc-500 mb-6 max-w-sm">
                  This tab was suspended to save memory.
                </p>
                <button 
                  onClick={() => updateTab(tab.id, { isSuspended: false, lastAccessed: Date.now(), isLoading: true })} 
                  className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Reload Tab
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Bar (Brave Style) */}
      <div className="bg-white border-t border-zinc-200 px-4 py-2 flex items-center justify-between pb-safe z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={goBack} 
          disabled={activeTab.historyIndex === 0} 
          className="p-3 text-zinc-700 disabled:text-zinc-300 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={goForward} 
          disabled={activeTab.historyIndex === activeTab.history.length - 1} 
          className="p-3 text-zinc-700 disabled:text-zinc-300 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
        <button 
          onClick={() => navigateTo(homeUrl)} 
          className="p-3 text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <Search className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setShowTabSwitcher(true)} 
          className="p-3 text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors relative"
        >
          <div className="w-6 h-6 border-2 border-zinc-700 rounded-[6px] flex items-center justify-center text-[11px] font-bold">
            {tabs.length}
          </div>
        </button>
        <button 
          onClick={() => setShowBookmarks(!showBookmarks)}
          className="p-3 text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <MoreVertical className="w-6 h-6" />
        </button>
      </div>

      {/* Bookmarks/Menu Bottom Sheet */}
      <AnimatePresence>
        {showBookmarks && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 z-30"
              onClick={() => setShowBookmarks(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-40 max-h-[80vh] flex flex-col pb-safe"
            >
              <div className="flex justify-center p-3">
                <div className="w-12 h-1.5 bg-zinc-300 rounded-full"></div>
              </div>
              <div className="px-6 pb-4 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-zinc-800">Menu</h2>
                <div className="flex gap-2">
                  <button onClick={toggleBookmark} className="p-2 bg-zinc-100 rounded-full text-zinc-700">
                    <Star className={`w-5 h-5 ${isBookmarked ? 'fill-orange-500 text-orange-500' : ''}`} />
                  </button>
                  <button onClick={() => { setShowBookmarks(false); setShowSettings(true); }} className="p-2 bg-zinc-100 rounded-full text-zinc-700">
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 px-2">Bookmarks</h3>
                <div className="space-y-1">
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-sm">
                      No bookmarks yet
                    </div>
                  ) : (
                    bookmarks.map((bookmark, idx) => (
                      <div key={idx} className="flex items-center justify-between group p-3 hover:bg-zinc-100 rounded-2xl transition-colors">
                        <button 
                          onClick={() => {
                            navigateTo(bookmark.url);
                            setShowBookmarks(false);
                          }}
                          className="flex-1 flex items-center gap-3 text-left truncate pr-2"
                        >
                          <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center shrink-0">
                            <Bookmark className="w-5 h-5 text-zinc-500" />
                          </div>
                          <div className="truncate">
                            <div className="text-sm font-bold text-zinc-800 truncate">{bookmark.title}</div>
                            <div className="text-xs text-zinc-500 truncate">{bookmark.url}</div>
                          </div>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookmarks(bookmarks.filter((_, i) => i !== idx));
                          }}
                          className="p-2 text-zinc-400 hover:text-red-500 bg-white shadow-sm rounded-full transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
