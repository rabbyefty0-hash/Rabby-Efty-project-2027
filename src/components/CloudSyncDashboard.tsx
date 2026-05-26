import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, CloudOff, RefreshCw, CheckCircle2, AlertTriangle, History, 
  Settings2, Activity, LogOut, Database, Sparkles, Shield, ArrowRight, ArrowUpRight
} from 'lucide-react';
import { SyncStatus, SyncConflict } from '../lib/vfsSync';
import { getAccessToken, signInWithGoogle, logout } from '../firebase';

interface CloudSyncDashboardProps {
  syncStatus: SyncStatus;
  conflicts: SyncConflict[];
  autoSync: boolean;
  setAutoSync: (val: boolean) => void;
  onTriggerSync: () => void;
  onClearHistory: () => void;
  onResolveConflict: (conflict: SyncConflict, decision: 'local' | 'remote') => void;
  forceTriggerKey: number;
  setForceTriggerKey: React.Dispatch<React.SetStateAction<number>>;
}

export function CloudSyncDashboard({
  syncStatus,
  conflicts,
  autoSync,
  setAutoSync,
  onTriggerSync,
  onClearHistory,
  onResolveConflict,
  forceTriggerKey,
  setForceTriggerKey
}: CloudSyncDashboardProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const token = getAccessToken();
  const isGoogleConnected = !!token && token !== 'mock_workspace_token';

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      setForceTriggerKey(prev => prev + 1); // trigger reload
    } catch (err: any) {
      console.error('Google authorization failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      setForceTriggerKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never synced';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto pb-8 text-black dark:text-white" id="cloud-sync-dashboard">
      
      {/* 1. Connection Status Card */}
      <div 
        id="connection-status-card"
        className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm transition-all relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isGoogleConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {isGoogleConnected ? <Cloud className="w-6 h-6" /> : <CloudOff className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Cloud Connector</p>
              <h2 className="text-lg font-bold">
                {isGoogleConnected ? 'Google Drive Link' : 'Offline Storage Simulator'}
              </h2>
            </div>
          </div>
          <span className={`h-2 w-2 rounded-full ${isGoogleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
        </div>

        {isGoogleConnected ? (
          <div className="space-y-4" id="logged-in-container">
            <div className="text-sm text-gray-600 dark:text-zinc-300">
              <span className="font-semibold text-gray-800 dark:text-white">Active session linked:</span> Real-time remote file replication to your personal cloud files is fully enabled!
            </div>
            
            <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Storage Node</span>
                <span className="text-xs font-semibold font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                  drive.google.com/RabbyOS_VFS_Sync
                </span>
              </div>
              <button 
                onClick={handleDisconnect}
                id="btn-disconnect"
                className="text-[11px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-all"
              >
                <LogOut className="w-3 h-3" /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4" id="logged-out-container">
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-normal">
              Connect Google Drive to replicates and sync files securely across all of your browsers and platforms. Sign-in popup blocked? Open this app in a new browser tab using <strong className="text-black dark:text-white">"Open App" (↗)</strong> before hitting Google authorization.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                id="btn-google-sign-in"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Cloud className="w-4 h-4 fill-white/20" />
                    <span>Authorize Drive Auth</span>
                  </>
                )}
              </button>

              <div className="bg-zinc-100 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-xl p-2 px-3 flex flex-col justify-center">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Fallback Sandbox</span>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-zinc-500" /> Guest Sandbox Active
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Sync Pulse & Progress Panel */}
      <div 
        id="sync-trigger-panel"
        className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm text-center flex flex-col items-center gap-4 relative"
      >
        <div className="w-full flex justify-between text-xs text-gray-400 font-medium">
          <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-blue-500" /> Status: {syncStatus.statusText}</span>
          <span>Last Synced: {formatTime(syncStatus.lastSynced)}</span>
        </div>

        {/* Sync state graphic */}
        <div className="relative my-2">
          {/* Animated Glow rings */}
          <AnimatePresence>
            {syncStatus.isSyncing && (
              <>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 bg-blue-500/20 rounded-full"
                />
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.2, opacity: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 bg-blue-500/10 rounded-full"
                />
              </>
            )}
          </AnimatePresence>

          <button 
            onClick={onTriggerSync}
            disabled={syncStatus.isSyncing}
            id="sync-pulse-button"
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 relative transition-all active:scale-95 ${
              syncStatus.isSyncing 
                ? 'bg-blue-50 border-blue-500 dark:bg-zinc-805 text-blue-600'
                : syncStatus.error
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-500 hover:bg-rose-100/50'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/85'
            }`}
          >
            {syncStatus.isSyncing ? (
              <>
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold font-mono mt-2">{syncStatus.progress}%</span>
              </>
            ) : syncStatus.error ? (
              <>
                <AlertTriangle className="w-8 h-8 text-rose-500" />
                <span className="text-[10px] font-extrabold uppercase tracking-wide mt-1">Failed</span>
              </>
            ) : (
              <>
                <Cloud className="w-8 h-8" />
                <span className="text-xs font-bold mt-2">Sync Now</span>
              </>
            )}
          </button>
        </div>

        {syncStatus.isSyncing && (
          <div className="w-full space-y-2.5" id="sync-progress-details">
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-300 rounded-full" 
                style={{ width: `${syncStatus.progress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-400 font-mono tracking-wider">
              <span>REPLICATION PROGRESS: {syncStatus.progress}%</span>
              {(syncStatus.uploadSpeed || syncStatus.timeRemaining) && (
                <div className="flex gap-2.5 items-center">
                  {syncStatus.uploadSpeed && (
                    <span className="text-blue-500 bg-blue-500/10 dark:bg-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                      <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                      {syncStatus.uploadSpeed}
                    </span>
                  )}
                  {syncStatus.timeRemaining && (
                    <span className="text-zinc-650 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-805 px-1.5 py-0.5 rounded font-bold">
                      {syncStatus.timeRemaining}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Conflict Resolver Panel */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-zinc-50 dark:bg-zinc-900 border-2 border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-4"
            id="conflict-resolver-panel"
          >
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/5 dark:border-white/5">
              <Shield className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-zinc-800 dark:text-white">Active Conflicts Detected</h3>
                <p className="text-[10px] text-gray-500 dark:text-zinc-400">Please choose which file modification states to keep</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {conflicts.map((conflict) => (
                <div 
                  key={conflict.localNode.id} 
                  className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-black/5 dark:border-white/10 space-y-3"
                >
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    File: {conflict.localNode.name}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    {/* Local side */}
                    <div className="bg-black/5 dark:bg-white/5 p-2.5 rounded-lg border border-black/5">
                      <span className="font-extrabold text-blue-500 block mb-1 uppercase tracking-wider text-[9px]">LOCAL DEVICE</span>
                      <p className="text-gray-400 font-mono">Size: {formatSize(conflict.localNode.size)}</p>
                      <p className="text-gray-400 font-mono">Mod: {new Date(conflict.localNode.modifiedAt).toLocaleTimeString()}</p>
                      <button
                        onClick={() => onResolveConflict(conflict, 'local')}
                        className="w-full mt-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 rounded-lg transition-all"
                      >
                        Keep Local
                      </button>
                    </div>

                    {/* Remote side */}
                    <div className="bg-black/5 dark:bg-white/5 p-2.5 rounded-lg border border-black/5">
                      <span className="font-extrabold text-amber-500 block mb-1 uppercase tracking-wider text-[9px]">CLOUD SYNC</span>
                      <p className="text-gray-400 font-mono">Size: {formatSize(conflict.remoteNode.size)}</p>
                      <p className="text-gray-400 font-mono">Mod: {new Date(conflict.remoteNode.modifiedAt).toLocaleTimeString()}</p>
                      <button
                        onClick={() => onResolveConflict(conflict, 'remote')}
                        className="w-full mt-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 rounded-lg transition-all"
                      >
                        Keep Cloud
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Settings Configuration */}
      <div 
        id="sync-settings-card"
        className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4"
      >
        <h3 className="font-bold text-sm flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2.5">
          <Settings2 className="w-4 h-4 text-zinc-500" />
          Replication Parameters
        </h3>

        <div className="flex items-center justify-between" id="auto-sync-setting">
          <div className="pr-4">
            <span className="text-xs font-bold block">Background Auto-Replication</span>
            <span className="text-[10px] text-gray-500 dark:text-zinc-400 leading-relaxed block">
              Automatically replicates virtual nodes 3s after local changes or writes are committed.
            </span>
          </div>
          
          {/* Custom Switch */}
          <button 
            role="switch" 
            aria-checked={autoSync}
            onClick={() => setAutoSync(!autoSync)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-250 cursor-pointer ${autoSync ? 'bg-blue-500' : 'bg-gray-200 dark:bg-zinc-800'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-250 ${autoSync ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* 5. Terminal Logs */}
      <div 
        id="sync-logs-card"
        className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3"
      >
        <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2.5">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-500" />
            Transfer Events Console
          </h3>
          <button 
            onClick={onClearHistory}
            id="btn-purge-logs"
            className="text-[10px] font-extrabold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-850 p-1 px-2.5 rounded-lg border border-black/5 dark:border-white/5 transition"
          >
            Purge Logs
          </button>
        </div>

        {/* Monospace Output */}
        <div 
          id="terminal-monitor"
          className="bg-zinc-950 text-[10px] font-mono p-4 rounded-xl max-h-[160px] overflow-y-auto space-y-1.5 border border-zinc-800 leading-normal scrollbar-thin shadow-inner text-left"
        >
          {syncStatus.logs.map((log) => (
            <div key={log.id} className="flex gap-1 items-start leading-[1.3] text-left">
              <span className="text-zinc-650 shrink-0 select-none">[{log.time}]</span>
              <span className={`font-bold uppercase tracking-wider shrink-0 select-none ${
                log.type === 'success' ? 'text-emerald-500' :
                log.type === 'error' ? 'text-rose-500' :
                log.type === 'warn' ? 'text-amber-500' :
                'text-blue-400'
              }`}>
                {log.type}:
              </span>
              <span className={`${log.type === 'error' ? 'text-rose-450' : 'text-zinc-330'}`}>{log.message}</span>
            </div>
          ))}

          {syncStatus.logs.length === 0 && (
            <div className="text-zinc-600 text-center py-8 italic select-none">
              Console logs idle. Trigger "Sync Now" to spool transfer events.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
