import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Sparkles, Image as ImageIcon, Video, Mic, Shield, Globe, DownloadCloud, ThumbsUp, Smartphone, Swords, Activity, CreditCard, Mail, MessageCircle, Phone, Folder, Search, TrendingUp, Calculator, StickyNote, CloudRain, Calendar, Map, Camera, Clock, Users, Music, Settings, Palette, ImagePlus, Images, Wand2, X, LayoutGrid, Play, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../ThemeContext';

// -------------------------------------------------------------
// Live Moving Clock App Icon
// -------------------------------------------------------------
const MovingClockIcon = memo(() => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  
  const hr = time.getHours();
  const min = time.getMinutes();
  const sec = time.getSeconds();
  
  const hrRotation = (hr % 12) * 30 + min * 0.5;
  const minRotation = min * 6 + sec * 0.1;
  const secRotation = sec * 6;
  
  return (
    <div className="w-full h-full bg-slate-50 relative flex items-center justify-center p-1.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.15)] rounded-inherit">
      <div className="w-full h-full rounded-full bg-gradient-to-b from-white to-slate-100 border border-slate-200/80 shadow-md relative flex items-center justify-center">
        <div className="absolute top-1 w-0.5 h-1.5 bg-slate-800 rounded-full" />
        <div className="absolute bottom-1 w-0.5 h-1.5 bg-slate-800 rounded-full" />
        <div className="absolute left-1 w-1.5 h-0.5 bg-slate-800 rounded-full" />
        <div className="absolute right-1 w-1.5 h-0.5 bg-slate-800 rounded-full" />
        <div 
          className="absolute w-[1.5px] h-[27%] bg-slate-900 rounded-full origin-bottom"
          style={{ 
            transform: `rotate(${hrRotation}deg) translateY(-50%)`,
            top: 'calc(50% - 27%)',
          }} 
        />
        <div 
          className="absolute w-[1.5px] h-[38%] bg-slate-600 rounded-full origin-bottom"
          style={{ 
            transform: `rotate(${minRotation}deg) translateY(-50%)`,
            top: 'calc(50% - 38%)',
          }} 
        />
        <div 
          className="absolute w-[1px] h-[44%] bg-rose-500 rounded-full origin-bottom"
          style={{ 
            transform: `rotate(${secRotation}deg) translateY(-50%)`,
            top: 'calc(50% - 44%)',
          }} 
        />
        <div className="absolute w-1.5 h-1.5 bg-rose-600 rounded-full shadow-md border border-white z-10" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Live Interactive Calendar App Icon
// -------------------------------------------------------------
const RealisticCalendarIconComponent = memo(() => {
  const date = new Date();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dayNumber = date.getDate();
  return (
    <div className="w-full h-full bg-white flex flex-col items-center overflow-hidden border border-slate-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.15)] rounded-inherit text-center">
      <div className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-0.5 text-[8px] sm:text-[9px] font-extrabold tracking-widest leading-none shadow-sm uppercase">
        {dayName}
      </div>
      <div className="flex-1 flex items-center justify-center pb-1">
        <span className="text-lg sm:text-xl font-black tracking-tighter text-slate-800 leading-none">{dayNumber}</span>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Realistic Folder (Files) Icon
// -------------------------------------------------------------
const ManilaFolder3DIcon = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 relative overflow-hidden flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.55),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.15)] rounded-inherit">
      <div className="absolute bottom-0 left-0 right-0 h-[64%] bg-gradient-to-t from-amber-600 via-amber-500 to-amber-450 rounded-t-xl shadow-[-2px_-4px_10px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.35)] z-20 flex items-center justify-center border-t border-amber-300">
        <div className="w-5 h-1 bg-amber-800/40 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]" />
      </div>
      <div className="absolute top-[18%] left-2.5 w-1/2 h-[22%] bg-amber-500 rounded-t-lg shadow-inner z-0 border-t border-l border-amber-300" />
      <div className="absolute top-[20%] left-4 right-4 h-1/2 bg-white rounded-md shadow-sm rotate-[4deg] z-10 border border-slate-100 flex flex-col gap-0.5 p-1 justify-center">
        <div className="w-4 h-[1.5px] bg-sky-300 rounded-full" />
        <div className="w-5 h-[1.5px] bg-slate-200 rounded-full" />
      </div>
      <div className="absolute top-[23%] left-3.5 right-4.5 h-1/2 bg-slate-50 rounded-md shadow-md -rotate-[3deg] z-10 border border-slate-100/90" />
    </div>
  );
});

// -------------------------------------------------------------
// Polaroid Style Photo Gallery Icon
// -------------------------------------------------------------
const RealisticGalleryIcon = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-550 to-pink-500 relative flex items-center justify-center p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.15)] rounded-inherit">
      <div className="w-[86%] h-[86%] bg-white rounded-lg p-0.5 pb-1.5 shadow-xl rotate-[5deg] flex flex-col justify-between border border-slate-100">
        <div className="flex-1 w-full bg-gradient-to-br from-teal-400 to-emerald-500 rounded-md overflow-hidden relative flex items-center justify-center">
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-sm" />
          <div className="absolute -bottom-1 -left-1 w-1/2 h-1/2 bg-emerald-600 rotate-[45deg] rounded-sm" />
          <div className="absolute -bottom-1.5 -right-1 w-2/3 h-2/3 bg-emerald-700 -rotate-[30deg] rounded-sm" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-70 pointer-events-none" />
    </div>
  );
});

// -------------------------------------------------------------
// Interactive Styled Calculator Icon
// -------------------------------------------------------------
const RealisticCalculatorIcon = memo(() => {
  return (
    <div className="w-full h-full bg-zinc-900 border border-zinc-950 flex flex-col p-1 justify-between relative shadow-[inset_0_2px_5px_rgba(255,255,255,0.2),inset_0_-3px_5px_rgba(0,0,0,0.85),0_8px_16px_rgba(0,0,0,0.25)] rounded-inherit">
      <div className="w-full h-[32%] bg-emerald-950 border border-emerald-900 rounded-md p-0.5 flex items-center justify-end shadow-inner mb-0.5">
        <span className="text-[8px] font-mono font-bold tracking-tight text-emerald-400 scale-x-95 animate-pulse">2026</span>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-[1px]">
        <div className="bg-zinc-800 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border border-zinc-950 flex items-center justify-center text-[7px] font-extrabold text-zinc-300">7</div>
        <div className="bg-zinc-800 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border border-zinc-950 flex items-center justify-center text-[7px] font-extrabold text-zinc-300">8</div>
        <div className="bg-gradient-to-b from-orange-400 to-orange-500 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] border border-amber-600 flex items-center justify-center text-[8px] font-black text-white">+</div>
        <div className="bg-zinc-800 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border border-zinc-950 flex items-center justify-center text-[7px] font-extrabold text-zinc-300">4</div>
        <div className="bg-zinc-800 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border border-zinc-950 flex items-center justify-center text-[7px] font-extrabold text-zinc-300">5</div>
        <div className="bg-gradient-to-b from-orange-400 to-orange-500 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] border border-amber-600 flex items-center justify-center text-[8px] font-black text-white">=</div>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Legal Writing Pad Style Notes Icon
// -------------------------------------------------------------
const RealisticNotesIcon = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-amber-300 to-amber-450 relative overflow-hidden p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.15)] rounded-inherit">
      <div className="w-full h-full border border-amber-200/50 bg-amber-50 rounded p-1 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-around py-3.5 pointer-events-none opacity-30">
          <div className="w-full border-b border-amber-700" />
          <div className="w-full border-b border-amber-700" />
        </div>
        <div className="absolute left-2 top-0 bottom-0 border-l border-red-400/40" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-amber-800 to-amber-750 shadow-sm" />
        <div className="ml-2.5 mt-0.5 flex flex-col gap-0.5">
          <div className="w-4 h-0.75 bg-amber-900/60 rounded-full" />
        </div>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Pro Mirrorless Reflex Camera Lens App Icon
// -------------------------------------------------------------
const RealisticCameraIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.4),0_8px_16px_rgba(0,0,0,0.25)] rounded-inherit">
      <div className="w-8 h-8 rounded-full bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-550 border border-zinc-700 flex items-center justify-center shadow-lg">
        <div className="w-6 h-6 rounded-full bg-zinc-950 flex items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0.5 left-0.5 w-[75%] h-[75%] bg-gradient-to-br from-cyan-400/20 via-transparent to-transparent rounded-full z-10" />
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-gradient-to-tr from-indigo-500/15 via-transparent to-transparent rounded-full z-10" />
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-zinc-900 to-black border border-cyan-850 flex items-center justify-center shadow-inner">
            <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]" />
          </div>
        </div>
      </div>
      <div className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-amber-400/90 shadow-[0_0_4px_rgba(251,191,36,0.8)] border border-yellow-200 pointer-events-none" />
    </div>
  );
});

// -------------------------------------------------------------
// Reflective CD/Vinyl Shimmer Music App Icon
// -------------------------------------------------------------
const RealisticMusicIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-rose-500 via-pink-600 to-indigo-600 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.25)] rounded-inherit overflow-hidden">
      <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute inset-[-40%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent,rgba(255,255,255,0.15),transparent,rgba(255,100,200,0.15),transparent,rgba(255,255,255,0.15))] animate-spin" style={{ animationDuration: '9s' }} />
        <div className="w-[30%] h-[30%] rounded-full bg-white flex items-center justify-center z-10 shadow-sm border border-slate-100">
          <Music className="w-2 h-2 text-pink-550" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Paper Grid Map App Icon with 3D GPS Bounce Pin
// -------------------------------------------------------------
const RealisticMapsIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-inherit relative overflow-hidden flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(16,185,129,0.2)]">
      <svg className="absolute inset-0 w-full h-full opacity-30 text-white" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 0,20 L 100,50 M 0,65 L 100,80 M 35,0 L 40,100 M 70,0 L 60,100" stroke="currentColor" strokeWidth="2.5" fill="none" />
      </svg>
      <svg className="absolute inset-0 w-full h-full opacity-80 text-blue-500" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 20,40 Q 45,55 75,65" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
      <div className="absolute top-[35%] left-[43%] w-3 h-4 flex flex-col items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-red-500 border border-white flex items-center justify-center shadow-lg relative animate-bounce z-10">
          <div className="w-1 h-1 rounded-full bg-white" />
        </div>
        <div className="w-1.5 h-1 bg-black/40 rounded-full blur-[0.75px] -mt-1 shadow-sm" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Interactive High contrast Weather App Icon
// -------------------------------------------------------------
const RealisticWeatherIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-cyan-400 via-sky-450 to-blue-550 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(14,165,233,0.25)] rounded-inherit">
      <div className="absolute top-2 left-2 w-[44%] h-[44%] rounded-full bg-gradient-to-br from-yellow-300 to-amber-450 border border-yellow-200 shadow-[0_0_10px_rgba(252,211,77,0.85)] z-0" />
      <div className="absolute bottom-1.5 right-1.5 flex items-end z-10 shadow-sm">
        <div className="w-5 h-5 bg-white rounded-full shadow-[2px_2px_4px_rgba(0,0,0,0.12)] border border-slate-100 relative z-10 flex items-center justify-center" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Floating Bubble Chat WhatsApp App Icon
// -------------------------------------------------------------
const RealisticWhatsAppIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-green-500 to-green-650 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(22,163,74,0.22)] rounded-inherit">
      <div className="w-6.5 h-6.5 bg-white rounded-full shadow-md flex items-center justify-center relative border border-emerald-50">
        <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
        <div className="absolute bottom-[-1px] left-[-0.5px] w-2 h-2 bg-white border-l border-b border-emerald-50 rounded-bl-[2px] rotate-[-7deg]" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Cinema Glass Shutter YouTube App Icon
// -------------------------------------------------------------
const RealisticYouTubeIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-red-500 via-red-650 to-rose-750 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(220,38,38,0.25)] rounded-inherit">
      <div className="w-7 h-5 bg-white/20 rounded-md shadow-inner flex items-center justify-center border border-white/30 backdrop-blur-md">
        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-white ml-0.5" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// High-Gloss Blue Planet Browser App Icon
// -------------------------------------------------------------
const RealisticBrowserIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-450 via-teal-400 to-indigo-500 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(14,116,144,0.2)] rounded-inherit overflow-hidden">
      <div className="w-7 h-7 rounded-full bg-blue-600/80 border border-white/20 flex items-center justify-center relative shadow-inner">
        <div className="absolute inset-0 rounded-full border border-sky-300/25 scale-x-[0.35]" />
        <div className="absolute inset-0 rounded-full border border-sky-300/25 scale-x-[0.65]" />
        <div className="absolute inset-x-0 h-[0.5px] bg-sky-300/25 top-1/2 -translate-y-1/2" />
        <Globe className="w-4 h-4 text-white relative z-10" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// AI Search Aura Fire Search App Icon
// -------------------------------------------------------------
const Search3DIcon = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-amber-500 via-orange-600 to-red-650 relative flex items-center justify-center rounded-inherit shadow-[inset_0_2px_4px_rgba(255,255,255,0.55),0_8px_16px_rgba(249,115,22,0.3)]">
      <div className="w-7 h-7 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-md">
        <Search className="w-4 h-4 text-white" strokeWidth={2.75} />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Gear Chrome Settings App Icon
// -------------------------------------------------------------
const Settings3DIcon = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-600 via-zinc-700 to-zinc-900 relative flex items-center justify-center rounded-inherit shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.5),0_8px_16px_rgba(0,0,0,0.3)]">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-400 flex items-center justify-center border border-zinc-500/50 shadow-md animate-spin" style={{ animationDuration: '20s' }}>
        <Settings className="w-4.5 h-4.5 text-zinc-800" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Custom Newly added 3D app icons
// -------------------------------------------------------------
const BuildApk3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-teal-550 to-emerald-700 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(16,185,129,0.22)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-7.5 bg-black/20 rounded-xl border border-white/10 flex items-center justify-center relative shadow-inner">
        <Smartphone className="w-4 h-4 text-emerald-300 animate-pulse" />
        <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
      </div>
    </div>
  );
});

const Voice3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-rose-450 via-red-550 to-orange-500 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(244,63,94,0.22)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-7.5 bg-zinc-900/40 rounded-full border border-white/20 flex items-center justify-center relative shadow-md">
        <Mic className="w-4 h-4 text-white" />
        <div className="absolute inset-0 rounded-full border border-rose-300/20 animate-pulse" />
      </div>
    </div>
  );
});

const Vpn3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-teal-400 via-emerald-550 to-green-655 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(20,184,166,0.22)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-7.5 bg-black/25 rounded-xl border border-white/20 flex items-center justify-center shadow-md relative">
        <Shield className="w-4 h-4 text-white animate-pulse" />
        <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
      </div>
    </div>
  );
});

const Downloader3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-650 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(6,182,212,0.22)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-7.5 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center relative shadow-inner">
        <DownloadCloud className="w-4 h-4 text-cyan-300 animate-bounce" style={{ animationDuration: '2s' }} />
      </div>
    </div>
  );
});

const Status3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-700 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_16px_rgba(99,102,241,0.22)] rounded-inherit overflow-hidden">
      <div className="w-8 h-6.5 bg-black/35 rounded border border-white/15 flex items-center justify-center p-1 overflow-hidden relative">
        <Activity className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_4px_rgba(129,140,248,0.6)]" strokeWidth={2.5} />
      </div>
    </div>
  );
});

const CardGen3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-green-500 to-teal-655 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(16,185,129,0.22)] rounded-inherit overflow-hidden">
      <div className="w-8 h-5.5 bg-gradient-to-r from-zinc-800 to-zinc-950 rounded border border-white/20 shadow-md relative flex items-center p-0.5 justify-between">
        <CreditCard className="w-3 h-3 text-emerald-400" />
        <div className="w-2 h-1.5 bg-yellow-400/90 rounded-[1px] shadow-sm" />
      </div>
    </div>
  );
});

const ArenaAi3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-orange-400 via-red-500 to-red-650 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(249,115,22,0.25)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-7.5 bg-black/25 rounded-full border border-white/20 flex items-center justify-center relative">
        <Swords className="w-4 h-4 text-amber-300 animate-pulse" />
      </div>
    </div>
  );
});

const Unblocker3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-red-400 via-rose-500 to-red-700 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(239,68,68,0.22)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-7.5 bg-black/25 rounded-xl border border-white/20 flex items-center justify-center relative shadow-md">
        <Shield className="w-4 h-4 text-rose-300" />
      </div>
    </div>
  );
});

const FbAutolike3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_16px_rgba(59,130,246,0.22)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-7.5 rounded-full bg-white flex items-center justify-center shadow-md relative">
        <ThumbsUp className="w-4 h-4 text-blue-600 fill-blue-600" />
      </div>
    </div>
  );
});

const TempMail3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-violet-400 via-purple-550 to-indigo-650 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(139,92,246,0.22)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-6 bg-white/10 rounded border border-white/20 flex items-center justify-center relative shadow-inner">
        <Mail className="w-4 h-4 text-white" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
      </div>
    </div>
  );
});

const TempNumber3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-400 via-cyan-550 to-blue-600 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(59,130,246,0.22)] rounded-inherit overflow-hidden">
      <div className="w-6 h-8 bg-zinc-950/40 rounded border border-white/15 flex flex-col p-0.5 items-center justify-between relative shadow-inner">
        <Phone className="w-3 h-3 text-cyan-300" />
        <div className="w-1 h-1 rounded-full bg-white/20" />
      </div>
    </div>
  );
});

const Followeran3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-650 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_16px_rgba(79,70,229,0.22)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-7.5 bg-white/10 rounded-xl border border-white/15 flex items-center justify-center relative shadow-inner">
        <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
    </div>
  );
});

const Contacts3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-650 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_16px_rgba(99,102,241,0.22)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-7.5 bg-white/20 rounded-full border border-white/20 flex items-center justify-center shadow-md relative">
        <Users className="w-4 h-4 text-white" />
      </div>
    </div>
  );
});

const AiImage3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-655 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(139,92,246,0.25)] rounded-inherit overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
      <div className="w-7.5 h-7.5 bg-black/25 rounded-xl border border-white/20 flex items-center justify-center relative">
        <Wand2 className="w-4 h-4 text-pink-350 animate-pulse" />
      </div>
    </div>
  );
});

const VideoGenerator3DIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-pink-400 via-rose-500 to-rose-700 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_8px_16px_rgba(244,63,94,0.25)] rounded-inherit overflow-hidden">
      <div className="w-7.5 h-7.5 bg-black/25 rounded-xl border border-white/20 flex items-center justify-center relative">
        <Video className="w-4 h-4 text-rose-300" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Interactive Styled Fallback Renderer
// -------------------------------------------------------------
const RealisticGeneric3DIconComponent = memo(({ app }: { app: any }) => {
  return (
    <div className={`w-full h-full ${app.bg || 'bg-gradient-to-br from-zinc-700 to-zinc-900'} relative flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_rgba(0,0,0,0.2)] rounded-inherit border border-white/10`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 opacity-55 pointer-events-none" />
      <app.icon className={`w-[45%] h-[45%] ${app.color || 'text-white'} drop-shadow-md relative z-10`} strokeWidth={1.75} />
    </div>
  );
});

// -------------------------------------------------------------
// Icon Selection Router Component
// -------------------------------------------------------------
const Render3DIcon = memo(({ appId, app }: { appId: string; app: any }) => {
  switch (appId) {
    case 'clock':
      return <MovingClockIcon />;
    case 'calendar':
      return <RealisticCalendarIconComponent />;
    case 'file-manager':
      return <ManilaFolder3DIcon />;
    case 'gallery':
      return <RealisticGalleryIcon />;
    case 'calculator':
      return <RealisticCalculatorIcon />;
    case 'notes':
      return <RealisticNotesIcon />;
    case 'camera':
      return <RealisticCameraIconComponent />;
    case 'music':
      return <RealisticMusicIconComponent />;
    case 'maps':
      return <RealisticMapsIconComponent />;
    case 'weather':
      return <RealisticWeatherIconComponent />;
    case 'whatsapp':
      return <RealisticWhatsAppIconComponent />;
    case 'youtube':
      return <RealisticYouTubeIconComponent />;
    case 'browser':
      return <RealisticBrowserIconComponent />;
    case 'ai-search':
      return <Search3DIcon />;
    case 'settings':
      return <Settings3DIcon />;
    case 'build-apk':
      return <BuildApk3DIconComponent />;
    case 'image':
      return <AiImage3DIconComponent />;
    case 'video':
      return <VideoGenerator3DIconComponent />;
    case 'voice':
      return <Voice3DIconComponent />;
    case 'vpn':
      return <Vpn3DIconComponent />;
    case 'downloader':
      return <Downloader3DIconComponent />;
    case 'status':
      return <Status3DIconComponent />;
    case 'card-gen':
      return <CardGen3DIconComponent />;
    case 'arena-ai':
      return <ArenaAi3DIconComponent />;
    case 'unblocker':
      return <Unblocker3DIconComponent />;
    case 'fb-autolike':
      return <FbAutolike3DIconComponent />;
    case 'temp-mail':
      return <TempMail3DIconComponent />;
    case 'temp-number':
      return <TempNumber3DIconComponent />;
    case 'followeran':
      return <Followeran3DIconComponent />;
    case 'contacts':
      return <Contacts3DIconComponent />;
    default:
      return <RealisticGeneric3DIconComponent app={app} />;
  }
});

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
  { id: 'workspace', name: 'Google Workspace', icon: LayoutGrid, color: 'text-white', bg: 'bg-gradient-to-br from-indigo-500 to-blue-600' },
  { id: 'media-player', name: 'Media Player', icon: Play, color: 'text-white', bg: 'bg-gradient-to-br from-red-500 to-pink-600' },
  { id: 'text-gen', name: 'AI Writer', icon: FileText, color: 'text-white', bg: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
  { id: 'google-flow', name: 'Google FLOW AI', icon: Sparkles, color: 'text-white', bg: 'bg-gradient-to-br from-purple-500 to-indigo-600' },
];

const CATEGORIES = [
  {
    name: "All Applications",
    apps: ['build-apk', 'image', 'video', 'voice', 'vpn', 'browser', 'downloader', 'status', 'card-gen', 'arena-ai', 'unblocker', 'ai-search', 'fb-autolike', 'temp-mail', 'temp-number', 'whatsapp', 'file-manager', 'gallery', 'followeran', 'settings', 'calculator', 'notes', 'weather', 'calendar', 'maps', 'camera', 'clock', 'contacts', 'music', 'youtube', 'workspace', 'media-player', 'text-gen', 'google-flow']
  },
  {
    name: "Suggestions",
    apps: ['image', 'video', 'music', 'whatsapp']
  },
  {
    name: "Creativity",
    apps: ['image', 'video', 'voice', 'music', 'camera', 'gallery', 'arena-ai', 'ai-search', 'youtube', 'media-player', 'text-gen', 'google-flow']
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
    apps: ['vpn', 'browser', 'downloader', 'status', 'card-gen', 'build-apk', 'unblocker', 'workspace', 'text-gen', 'google-flow']
  }
];

const CATEGORIES_STYLING: Record<string, { desc: string; glow: string; border: string; highlight: string }> = {
  "All Applications": {
    desc: "Every Installed Application",
    glow: "group-hover:from-violet-500/20 group-hover:to-rose-500/25",
    border: "border-white/10 hover:border-violet-500/30",
    highlight: "text-violet-400"
  },
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
          <div className={`w-[85%] h-[85%] ${getIconShapeClass()} flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95 relative overflow-hidden rounded-inherit`}>
            <Render3DIcon appId={app.id} app={app} />
            {renderBadge(app.id)}
          </div>
          <span className="text-[9px] font-semibold text-white/50 truncate w-full mt-1 text-center select-none group-hover:text-white/85 transition-colors">{app.name}</span>
        </button>
      );
    }

    if (mode === 'library-small') {
      return (
        <div className={`w-full h-full ${getIconShapeClass()} flex items-center justify-center shadow-sm relative overflow-hidden rounded-inherit`}>
          <Render3DIcon appId={app.id} app={app} />
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
            <div className={`${getIconSizeClass()} ${getIconShapeClass()} flex items-center justify-center mx-auto ios-icon transition-all duration-300 group-hover:scale-105 group-active:scale-95 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.4)] relative overflow-hidden rounded-inherit`}>
              <Render3DIcon appId={app.id} app={app} />
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
              {['All Folders', ...CATEGORIES.map(c => c.name)].map((catName) => {
                const internalName = catName === 'All Folders' ? 'All' : catName;
                const isActive = selectedFilter === internalName;
                return (
                  <button
                    key={catName}
                    onClick={() => setSelectedFilter(internalName)}
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
                {CATEGORIES.filter(cat => {
                  if (selectedFilter === 'All') {
                    return cat.name !== 'All Applications';
                  }
                  return cat.name === selectedFilter;
                }).map((category, catIdx) => {
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

