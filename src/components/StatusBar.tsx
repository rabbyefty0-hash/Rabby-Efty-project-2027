import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Signal, Wifi, WifiOff, Battery, BatteryCharging } from 'lucide-react';
import { useBattery } from '../BatteryContext';

interface StatusBarProps {
  theme: 'light' | 'dark';
  isVpnConnected: boolean;
}

export function StatusBar({ theme, isVpnConnected }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { batteryLevel, isCharging } = useBattery();
  const [wifiSignal, setWifiSignal] = useState(3); // 0-3
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Real connection listening
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Update every 10 seconds
    return () => clearInterval(timer);
  }, []);

  // Simulated Wifi Signal Fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setWifiSignal(prev => {
        const change = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(1, Math.min(3, prev + change));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const batteryColorClass = batteryLevel < 20 
    ? 'text-rose-500 animate-pulse' 
    : batteryLevel <= 50 
      ? 'text-amber-500' 
      : 'text-emerald-500';

  return (
    <div className="absolute top-2 left-0 right-0 h-[36px] z-[60] flex items-center justify-between px-8 pointer-events-none pwa-hide-status-bar">
      <div className={`text-[14px] font-bold tracking-tight flex items-center space-x-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
        <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        {isVpnConnected && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black tracking-tighter ml-1 shadow-lg"
          >
            VPN
          </motion.div>
        )}
      </div>
      
      <div className={`flex items-center space-x-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
        {!isOnline ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-1 text-rose-500 dark:text-rose-450 font-black text-[9px] uppercase tracking-wider animate-pulse bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20"
          >
            <WifiOff className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>Offline</span>
          </motion.div>
        ) : (
          <>
            <Signal className={`w-4 h-4 ${wifiSignal < 2 ? 'opacity-50' : 'opacity-100'}`} />
            <Wifi className={`w-4 h-4 ${wifiSignal < 3 ? 'opacity-70' : 'opacity-100'}`} />
          </>
        )}
        <div className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
          isCharging 
            ? (theme === 'light' ? 'bg-emerald-50/70 border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]' : 'bg-emerald-950/20 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.35)]') 
            : (theme === 'light' ? 'bg-black/5 border-black/10' : 'bg-white/10 backdrop-blur-md border-white/10')
        }`}>
          <span className="text-[11px] font-bold">{batteryLevel}%</span>
          {isCharging ? (
            <motion.div
              animate={{ 
                scale: [1, 1.18, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            >
              <BatteryCharging className={`w-3.5 h-3.5 ${batteryColorClass}`} />
            </motion.div>
          ) : (
            <Battery className={`w-3.5 h-3.5 ${batteryColorClass}`} />
          )}
          <div className={`w-6 h-3 border rounded-[4px] p-[1px] relative ${
            isCharging 
              ? (theme === 'light' ? 'border-emerald-400' : 'border-emerald-500/40') 
              : (theme === 'light' ? 'border-zinc-400' : 'border-white/30')
          }`}>
            <motion.div 
              className={`h-full rounded-[2px] transition-all duration-550 ${
                isCharging 
                  ? 'bg-emerald-500' 
                  : (batteryLevel < 20 ? 'bg-rose-500 animate-pulse' : (batteryLevel <= 50 ? 'bg-amber-500' : 'bg-emerald-500'))
              }`} 
              style={{ width: `${batteryLevel}%` }} 
              animate={isCharging ? { opacity: [0.55, 1, 0.55] } : undefined}
              transition={isCharging ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" } : undefined}
            />
            <div className={`absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-1.5 rounded-r-sm ${
              isCharging 
                ? (theme === 'light' ? 'bg-emerald-400' : 'bg-emerald-500/40') 
                : (theme === 'light' ? 'bg-zinc-400' : 'bg-white/30')
            }`} />
            {isCharging && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  animate={{ scale: [0.7, 1.2, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  className={`w-1.5 h-1.5 rounded-full ${theme === 'light' ? 'bg-emerald-600' : 'bg-white'}`} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
