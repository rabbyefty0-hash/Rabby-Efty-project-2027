import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, ShieldCheck, ExternalLink, Globe, AlertCircle, Star, Bookmark, Trash2, X, Settings, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [useProxy, setUseProxy] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
    localStorage.setItem('browser_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Tab suspension logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTabs(prevTabs => prevTabs.map(tab => {
        // Suspend tabs inactive for more than 5 minutes (300000 ms)
        if (tab.id !== activeTabId && !tab.isSuspended && (now - tab.lastAccessed > 300000)) {
          return { ...tab, isSuspended: true };
        }
        return tab;
      }));
    }, 60000); // Check every minute
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
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) {
      // If closing the last tab, just reset it
      updateTab(id, {
        url: homeUrl,
        inputUrl: homeUrl.replace('https://', '').replace('http://', ''),
        history: [homeUrl],
        historyIndex: 0,
        title: 'New Tab',
        isLoading: true,
        loadError: false
      });
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

  // Loading timeout handler
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (activeTab.isLoading) {
      timeout = setTimeout(() => {
        updateActiveTab({ isLoading: false, loadError: true });
      }, 15000); // 15 second timeout
    }
    return () => clearTimeout(timeout);
  }, [activeTab.isLoading, activeTabId]);

  const toggleVpn = () => {
    if (isVpnConnected) {
      setIsVpnConnected(false);
    } else {
      setIsConnecting(true);
      setTimeout(() => {
        setIsConnecting(false);
        setIsVpnConnected(true);
      }, 1500);
    }
  };

  const getEffectiveUrl = (targetUrl: string, proxyEnabled: boolean) => {
    if (proxyEnabled && !targetUrl.includes('google.com/search?igu=1') && !targetUrl.includes('google.com')) {
      return `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
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
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
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
      className="flex-1 flex flex-col h-full relative z-10 bg-white/95 backdrop-blur-2xl overflow-hidden border-white/20 shadow-2xl pt-12 pb-24"
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
      {/* Tab Bar */}
      <div className="bg-zinc-100/80 backdrop-blur-md flex items-center px-2 pt-2 pb-1 space-x-1 overflow-x-auto custom-scrollbar border-b border-zinc-200">
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-t-lg min-w-[120px] max-w-[180px] cursor-pointer transition-colors ${activeTabId === tab.id ? 'bg-white shadow-sm text-zinc-800' : 'bg-transparent text-zinc-500 hover:bg-zinc-200/50'}`} 
            onClick={() => {
              setActiveTabId(tab.id);
              updateTab(tab.id, { lastAccessed: Date.now() });
            }}
          >
            <Globe className={`w-3 h-3 shrink-0 ${tab.isSuspended ? 'text-zinc-300' : 'text-indigo-400'}`} />
            <span className="text-xs truncate flex-1 font-medium">{tab.title}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} 
              className="hover:bg-zinc-200 rounded-full p-0.5 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button 
          onClick={addTab} 
          className="p-1.5 hover:bg-zinc-200/80 rounded-md text-zinc-500 transition-colors ml-1"
          title="New Tab"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Browser Toolbar */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-zinc-200 p-3 flex flex-col space-y-3 shadow-sm">
        <div className="flex flex-col space-y-3 text-zinc-700">
          <form onSubmit={handleNavigate} className={`w-full flex items-center bg-white/60 backdrop-blur-md border rounded-full px-4 py-2 shadow-sm focus-within:bg-white/90 focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.1)] focus-within:scale-[1.01] transition-all duration-300 ease-out ${isVpnConnected ? 'border-green-500/30 ring-1 ring-green-500/20' : 'border-white/60 focus-within:border-indigo-200'}`}>
            <AnimatePresence mode="wait">
              {isVpnConnected ? (
                <motion.div
                  key="vpn-lock"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500 mr-2" />
                </motion.div>
              ) : (
                <motion.div
                  key="normal-lock"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-400 mr-2" />
                </motion.div>
              )}
            </AnimatePresence>
            <input 
              type="text" 
              value={activeTab.inputUrl}
              onChange={(e) => updateActiveTab({ inputUrl: e.target.value })}
              className="flex-1 bg-transparent text-[15px] outline-none text-zinc-800 placeholder:text-zinc-400"
              placeholder={isVpnConnected ? "Browsing securely via VPN..." : "Search or enter URL..."}
            />
            <button 
              type="button"
              onClick={toggleBookmark}
              className={`p-1 hover:bg-zinc-100 rounded-md transition-colors mr-1 ${isBookmarked ? 'text-yellow-500' : 'text-zinc-400 hover:text-yellow-500'}`}
              title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
            >
              <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button 
              type="button"
              onClick={openExternal}
              className="p-1 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-indigo-500 transition-colors"
              title="Open in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1">
              <button 
                onClick={goBack}
                disabled={activeTab.historyIndex === 0}
                className="p-2 hover:bg-zinc-200/50 rounded-full transition-all disabled:opacity-20 active:scale-90"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={goForward}
                disabled={activeTab.historyIndex === activeTab.history.length - 1}
                className="p-2 hover:bg-zinc-200/50 rounded-full transition-all disabled:opacity-20 active:scale-90"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                className="p-2 hover:bg-zinc-200/50 rounded-full transition-all active:scale-90"
                onClick={() => {
                  updateActiveTab({ isLoading: true, loadError: false, isSuspended: false });
                  const currentUrl = activeTab.url;
                  updateActiveTab({ url: null });
                  setTimeout(() => updateActiveTab({ url: currentUrl }), 10);
                }}
              >
                <RotateCw className={`w-5 h-5 ${activeTab.isLoading ? 'animate-spin text-indigo-500' : ''}`} />
              </button>
              <button 
                className="p-2 hover:bg-zinc-200/50 rounded-full transition-all active:scale-90"
                onClick={() => navigateTo(homeUrl)}
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
            
            <button 
              onClick={toggleVpn}
              disabled={isConnecting}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                isVpnConnected 
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                  : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300 border border-transparent'
              }`}
            >
              {isConnecting ? (
                <RotateCw className="w-3 h-3 animate-spin" />
              ) : (
                <ShieldCheck className={`w-3 h-3 ${isVpnConnected ? 'text-green-500' : 'text-zinc-400'}`} />
              )}
              <span>{isConnecting ? 'Securing...' : isVpnConnected ? 'VPN ON' : 'VPN OFF'}</span>
            </button>
          </div>
        </div>

        {/* Secondary Toolbar: Proxy & Info */}
        <div className="flex items-center justify-between px-2 pb-1 relative">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => {
                setUseProxy(!useProxy);
                const currentBaseUrl = activeTab.history[activeTab.historyIndex];
                const effectiveUrl = getEffectiveUrl(currentBaseUrl, !useProxy);
                updateActiveTab({ url: effectiveUrl, isLoading: true });
              }}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-colors ${useProxy ? 'bg-indigo-500 text-white' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'}`}
            >
              <Globe className="w-3 h-3" />
              <span>Proxy Mode: {useProxy ? 'ON' : 'OFF'}</span>
            </button>
            <button 
              onClick={() => {
                setShowBookmarks(!showBookmarks);
                setShowSettings(false);
              }}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-colors ${showBookmarks ? 'bg-indigo-500 text-white' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'}`}
            >
              <Bookmark className="w-3 h-3" />
              <span>Bookmarks</span>
            </button>
            <button 
              onClick={() => {
                setShowSettings(!showSettings);
                setShowBookmarks(false);
              }}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-colors ${showSettings ? 'bg-indigo-500 text-white' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'}`}
            >
              <Settings className="w-3 h-3" />
              <span>Settings</span>
            </button>
            <div className="flex items-center space-x-1 text-[9px] text-zinc-400 font-medium hidden sm:flex">
              <AlertCircle className="w-3 h-3" />
              <span>Some sites may block iframes. Use Proxy or Open in New Tab.</span>
            </div>
          </div>
          <div className="text-[9px] font-mono text-zinc-400">
            {activeTab.historyIndex + 1} / {activeTab.history.length}
          </div>

          {/* Bookmarks Dropdown */}
          <AnimatePresence>
            {showBookmarks && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-2 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                  <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Saved Bookmarks</h3>
                  <button onClick={() => setShowBookmarks(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 text-xs">
                      No bookmarks yet
                    </div>
                  ) : (
                    bookmarks.map((bookmark, idx) => (
                      <div key={idx} className="flex items-center justify-between group p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                        <button 
                          onClick={() => {
                            navigateTo(bookmark.url);
                            setShowBookmarks(false);
                          }}
                          className="flex-1 text-left truncate pr-2"
                        >
                          <div className="text-sm font-medium text-zinc-700 truncate">{bookmark.title}</div>
                          <div className="text-[10px] text-zinc-400 truncate">{bookmark.url}</div>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookmarks(bookmarks.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove bookmark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings Dropdown */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-2 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                  <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Browser Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Home Page URL</label>
                    <input 
                      type="text" 
                      value={tempHomeUrl}
                      onChange={(e) => setTempHomeUrl(e.target.value)}
                      className="w-full bg-zinc-100 border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="https://..."
                    />
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
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-md py-2 text-sm font-medium transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Browser Content */}
      <div className="flex-1 bg-white relative pb-0">
        {tabs.map(tab => (
          <div key={tab.id} className={`w-full h-full absolute inset-0 ${activeTabId === tab.id ? 'z-10' : 'z-0 hidden'}`}>
            {tab.isLoading && activeTabId === tab.id && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <RotateCw className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                <p className="text-xs font-medium text-zinc-500">Loading page...</p>
              </div>
            )}

            {tab.loadError && !tab.isLoading && activeTabId === tab.id && (
              <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Page Load Timeout</h3>
                <p className="text-sm text-zinc-500 mb-6 max-w-xs">
                  This website might be blocking the connection or taking too long to respond.
                </p>
                <div className="flex flex-col w-full max-w-xs space-y-2">
                  <button 
                    onClick={() => {
                      updateTab(tab.id, { isLoading: true, loadError: false });
                      const currentUrl = tab.url;
                      updateTab(tab.id, { url: null });
                      setTimeout(() => updateTab(tab.id, { url: currentUrl }), 10);
                    }}
                    className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors"
                  >
                    Retry Loading
                  </button>
                  <button 
                    onClick={openExternal}
                    className="w-full py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab</span>
                  </button>
                  <button 
                    onClick={() => {
                      setUseProxy(!useProxy);
                      const currentBaseUrl = tab.history[tab.historyIndex];
                      navigateTo(currentBaseUrl);
                    }}
                    className="text-xs text-indigo-500 font-bold hover:underline py-2"
                  >
                    {useProxy ? 'Try without Proxy' : 'Try with Proxy Mode'}
                  </button>
                </div>
              </div>
            )}
            
            {!tab.isSuspended ? (
              <iframe 
                src={tab.url || undefined} 
                loading={activeTabId === tab.id ? "eager" : "lazy"}
                className="w-full h-full border-none"
                title={`Browser View ${tab.id}`}
                onLoad={() => updateTab(tab.id, { isLoading: false, loadError: false })}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
                <Globe className="w-16 h-16 text-zinc-300 mb-4" />
                <h3 className="text-xl font-bold text-zinc-700 mb-2">Tab Suspended</h3>
                <p className="text-sm text-zinc-500 mb-6 max-w-sm">
                  This tab was suspended to save memory and improve performance because it was inactive for a while.
                </p>
                <button 
                  onClick={() => updateTab(tab.id, { isSuspended: false, lastAccessed: Date.now(), isLoading: true })} 
                  className="px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
                >
                  Reload Tab
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
