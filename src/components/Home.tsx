import React, { useState, useEffect, memo, useMemo } from 'react';
import { Sparkles, Video, Mic, Shield, Globe, DownloadCloud, ThumbsUp, Smartphone, Swords, Activity, CreditCard, Mail, MessageCircle, Phone, Folder, Cloud, Battery, Calendar, Search, Clock, Images, X, Wind, Music, Map, Camera, LayoutGrid, Heart, Flame, Settings, Lock, CheckCircle, MessageSquare, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../ThemeContext';
import { APPS } from '../App';
import { auth, onAuthStateChanged } from '../firebase';

interface HomeProps {
  onNavigate: (tab: any) => void;
  recentApps: any[];
}

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
      {/* Clock Face Panel */}
      <div className="w-full h-full rounded-full bg-gradient-to-b from-white to-slate-100 border border-slate-200/80 shadow-md relative flex items-center justify-center">
        {/* Subtle Hour Markers */}
        <div className="absolute top-1 w-0.5 h-1.5 bg-slate-800 rounded-full" />
        <div className="absolute bottom-1 w-0.5 h-1.5 bg-slate-800 rounded-full" />
        <div className="absolute left-1 w-1.5 h-0.5 bg-slate-800 rounded-full" />
        <div className="absolute right-1 w-1.5 h-0.5 bg-slate-800 rounded-full" />
        
        {/* Hour Hand */}
        <div 
          className="absolute w-0.75 h-[27%] bg-slate-900 rounded-full origin-bottom"
          style={{ 
            transform: `rotate(${hrRotation}deg) translateY(-50%)`,
            top: 'calc(50% - 27%)',
          }} 
        />
        {/* Minute Hand */}
        <div 
          className="absolute w-0.75 h-[38%] bg-slate-600 rounded-full origin-bottom"
          style={{ 
            transform: `rotate(${minRotation}deg) translateY(-50%)`,
            top: 'calc(50% - 38%)',
          }} 
        />
        {/* Second Hand */}
        <div 
          className="absolute w-[0.5px] h-[44%] bg-rose-500 rounded-full origin-bottom"
          style={{ 
            transform: `rotate(${secRotation}deg) translateY(-50%)`,
            top: 'calc(50% - 44%)',
          }} 
        />
        {/* Brass Center Cap */}
        <div className="absolute w-1.5 h-1.5 bg-rose-600 rounded-full shadow-md border border-white z-10" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Live Interactive-looking Calendar App Icon
// -------------------------------------------------------------
const RealisticCalendarIconComponent = memo(() => {
  const date = new Date();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dayNumber = date.getDate();
  return (
    <div className="w-full h-full bg-white flex flex-col items-center overflow-hidden border border-slate-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.15)] rounded-inherit text-center">
      <div className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-0.5 sm:py-1 text-[8px] sm:text-[9.5px] font-extrabold tracking-widest leading-none shadow-sm uppercase">
        {dayName}
      </div>
      <div className="flex-1 flex items-center justify-center pb-1">
        <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-800 leading-none">{dayNumber}</span>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Realistic Folder (Files) Icon
// -------------------------------------------------------------
const ManilaFolder3DIcon = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-650 relative overflow-hidden flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.55),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.15)] rounded-inherit">
      {/* Front flap overlay with realistic drop shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-[64%] bg-gradient-to-t from-amber-600 via-amber-500 to-amber-450 rounded-t-xl shadow-[-2px_-4px_10px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.35)] z-20 flex items-center justify-center border-t border-amber-300">
        <div className="w-5 h-1 bg-amber-800/40 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]" />
      </div>
      {/* Back tab */}
      <div className="absolute top-[18%] left-2.5 w-1/2 h-[22%] bg-amber-500 rounded-t-lg shadow-inner z-0 border-t border-l border-amber-300" />
      {/* Dynamic sheets of paper peeking out from folder */}
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
    <div className="w-full h-full bg-gradient-to-br from-indigo-505 via-purple-500 to-pink-500 relative flex items-center justify-center p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.15)] rounded-inherit">
      {/* Photos layout overlap */}
      <div className="w-[86%] h-[86%] bg-white rounded-lg p-1 pb-2 shadow-xl rotate-[5deg] flex flex-col justify-between border border-slate-100">
        <div className="flex-1 w-full bg-gradient-to-br from-teal-400 to-emerald-500 rounded-md overflow-hidden relative flex items-center justify-center">
          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-yellow-300 rounded-full blur-[0.25px] shadow-sm" />
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
    <div className="w-full h-full bg-zinc-900 border border-zinc-950 flex flex-col p-1.5 justify-between relative shadow-[inset_0_2px_5px_rgba(255,255,255,0.2),inset_0_-3px_5px_rgba(0,0,0,0.85),0_8px_16px_rgba(0,0,0,0.25)] rounded-inherit">
      {/* Beautiful Glowing LCD */}
      <div className="w-full h-[32%] bg-emerald-950 border border-emerald-900 rounded-md p-1 flex items-center justify-end shadow-inner mb-0.5">
        <span className="text-[10px] font-mono font-bold tracking-tight text-emerald-400 scale-x-95 animate-pulse">2026.05</span>
      </div>
      {/* Tactile Keypad */}
      <div className="flex-1 grid grid-cols-3 gap-[1px]">
        <div className="bg-zinc-800 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border border-zinc-950 flex items-center justify-center text-[7.5px] font-extrabold text-zinc-300">7</div>
        <div className="bg-zinc-800 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border border-zinc-950 flex items-center justify-center text-[7.5px] font-extrabold text-zinc-300">8</div>
        <div className="bg-gradient-to-b from-orange-400 to-orange-500 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] border border-amber-600 flex items-center justify-center text-[8.5px] font-black text-white">+</div>
        <div className="bg-zinc-800 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border border-zinc-950 flex items-center justify-center text-[7.5px] font-extrabold text-zinc-300">4</div>
        <div className="bg-zinc-800 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border border-zinc-950 flex items-center justify-center text-[7.5px] font-extrabold text-zinc-300">5</div>
        <div className="bg-gradient-to-b from-orange-400 to-orange-500 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] border border-amber-600 flex items-center justify-center text-[8.5px] font-black text-white">=</div>
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
      {/* Inner Sheet */}
      <div className="w-full h-full border border-amber-200/50 bg-amber-50 rounded p-1 flex flex-col justify-between relative overflow-hidden">
        {/* Line rulings */}
        <div className="absolute inset-0 flex flex-col justify-around py-3.5 pointer-events-none opacity-30">
          <div className="w-full border-b border-amber-700" />
          <div className="w-full border-b border-amber-700" />
          <div className="w-full border-b border-amber-700" />
        </div>
        {/* Red side margin */}
        <div className="absolute left-2.5 top-0 bottom-0 border-l border-red-400/40" />
        {/* Top spine binder */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-b from-amber-800 to-amber-700 shadow-sm flex justify-around px-2" />
        <div className="ml-3.5 mt-1 flex flex-col gap-0.5">
          <div className="w-5 h-1 bg-amber-900/60 rounded-full" />
          <div className="w-4 h-[0.75px] bg-slate-400 rounded-full" />
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
      {/* Outer aluminum lens grip */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-600 border border-zinc-700/80 flex items-center justify-center shadow-lg">
        {/* Dark inner barrel thread */}
        <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center shadow-inner relative overflow-hidden">
          {/* Cyan/indigo reflections */}
          <div className="absolute top-0.5 left-0.5 w-[75%] h-[75%] bg-gradient-to-br from-cyan-400/20 via-transparent to-transparent rounded-full z-10" />
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-gradient-to-tr from-indigo-500/15 via-transparent to-transparent rounded-full z-10" />
          {/* Pure glass lens core */}
          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-zinc-900 to-black border border-cyan-800 flex items-center justify-center shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
          </div>
        </div>
      </div>
      <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-amber-400/90 shadow-[0_0_4px_rgba(251,191,36,0.8)] border border-yellow-250 pointer-events-none" />
    </div>
  );
});

// -------------------------------------------------------------
// Reflective CD/Vinyl Shimmer Music App Icon
// -------------------------------------------------------------
const RealisticMusicIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-rose-500 via-pink-600 to-indigo-600 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.25)] rounded-inherit overflow-hidden">
      <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        {/* Holographic light bars */}
        <div className="absolute inset-[-40%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent,rgba(255,255,255,0.15),transparent,rgba(255,100,200,0.15),transparent,rgba(255,255,255,0.15))] animate-spin" style={{ animationDuration: '9s' }} />
        {/* Core circle */}
        <div className="w-[30%] h-[30%] rounded-full bg-white flex items-center justify-center z-10 shadow-sm border border-slate-100">
          <Music className="w-2.5 h-2.5 text-pink-500" strokeWidth={2.5} />
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
      {/* Topographic line traces */}
      <svg className="absolute inset-0 w-full h-full opacity-30 text-white" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 0,20 L 100,50 M 0,65 L 100,80 M 35,0 L 40,100 M 70,0 L 60,100" stroke="currentColor" strokeWidth="2.5" fill="none" />
      </svg>
      {/* Navigation blue route indicator */}
      <svg className="absolute inset-0 w-full h-full opacity-80 text-blue-500" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 20,40 Q 45,55 75,65" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
      {/* 3D GPS Pin */}
      <div className="absolute top-[35%] left-[43%] w-4 h-5 flex flex-col items-center justify-center">
        <div className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white flex items-center justify-center shadow-lg relative animate-bounce z-10">
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
    <div className="w-full h-full bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-550 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(14,165,233,0.25)] rounded-inherit">
      {/* Glowing sun element peeking from back */}
      <div className="absolute top-2.5 left-2.5 w-[44%] h-[44%] rounded-full bg-gradient-to-br from-yellow-300 to-amber-450 border border-yellow-200 shadow-[0_0_12px_rgba(252,211,77,0.85)] z-0" />
      {/* Realistic volumetric 3D-looking clouds overlay */}
      <div className="absolute bottom-2 right-2 flex items-end z-10 shadow-sm">
        <div className="w-5 h-5 bg-slate-500/10 backdrop-blur-[1px] rounded-full mr-[-8px] blur-[0.5px]" />
        <div className="w-7 h-7 bg-white rounded-full shadow-[2px_2px_4px_rgba(0,0,0,0.12)] border border-slate-100 relative z-10 flex items-center justify-center" />
        <div className="w-5.5 h-5.5 bg-slate-100 rounded-full shadow-sm ml-[-7px]" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Floating Bubble Chat WhatsApp App Icon
// -------------------------------------------------------------
const RealisticWhatsAppIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-green-500 to-green-600 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(22,163,74,0.22)] rounded-inherit">
      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow-md flex items-center justify-center relative border border-emerald-50">
        <MessageCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-600 fill-emerald-600" />
        <div className="absolute bottom-[-1.5px] left-[-0.5px] w-2.5 h-2.5 bg-white border-l border-b border-emerald-50 rounded-bl-[2px] rotate-[-7deg]" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Cinema Glass Shutter YouTube App Icon
// -------------------------------------------------------------
const RealisticYouTubeIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-red-500 via-red-600 to-rose-750 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(220,38,38,0.25)] rounded-inherit">
      <div className="w-8.5 h-6 bg-white/20 rounded-lg shadow-inner flex items-center justify-center border border-white/30 backdrop-blur-md">
        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[9px] border-l-white ml-0.5" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/15 pointer-events-none" />
    </div>
  );
});

// -------------------------------------------------------------
// High-Gloss Blue Planet Browser App Icon
// -------------------------------------------------------------
const RealisticBrowserIconComponent = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-450 via-teal-400 to-indigo-500 flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(14,116,144,0.2)] rounded-inherit overflow-hidden">
      <div className="w-8 h-8 rounded-full bg-blue-600/80 border border-white/20 flex items-center justify-center relative shadow-inner">
        <div className="absolute inset-0 rounded-full border border-sky-300/25 scale-x-[0.35]" />
        <div className="absolute inset-0 rounded-full border border-sky-300/25 scale-x-[0.65]" />
        <div className="absolute inset-x-0 h-[0.5px] bg-sky-300/25 top-1/2 -translate-y-1/2" />
        <div className="absolute inset-x-0 h-[0.5px] bg-sky-300/25 top-1/4" />
        <div className="absolute inset-x-0 h-[0.5px] bg-sky-300/25 top-3/4" />
        <Globe className="w-4.5 h-4.5 text-white relative z-10" />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Google Workspace Multi-Module Icon
// -------------------------------------------------------------
const Workspace3DIcon = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 relative flex items-center justify-center p-1.5 rounded-inherit shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_16px_rgba(79,70,229,0.3)]">
      <div className="grid grid-cols-2 gap-1 w-full h-full">
        <div className="bg-white/20 rounded-md shadow-inner flex items-center justify-center">
          <Folder className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="bg-white/20 rounded-md shadow-inner flex items-center justify-center">
          <Calendar className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="bg-white/20 rounded-md shadow-inner flex items-center justify-center">
          <MessageCircle className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="bg-white/20 rounded-md shadow-inner flex items-center justify-center">
          <Video className="w-3.5 h-3.5 text-white" />
        </div>
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
      <div className="w-8 h-8 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-md">
        <Search className="w-4.5 h-4.5 text-white" strokeWidth={2.75} />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Gear Chrome Settings App Icon
// -------------------------------------------------------------
const Settings3DIcon = memo(() => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-655 via-zinc-700 to-zinc-900 relative flex items-center justify-center rounded-inherit shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.5),0_8px_16px_rgba(0,0,0,0.3)]">
      <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-400 flex items-center justify-center border border-zinc-500/50 shadow-md">
        <Sparkles className="w-4.5 h-4.5 text-zinc-800 animate-spin" style={{ animationDuration: '14s' }} />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Interactive Styled Fallback / Tactical Generic Renderer
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
    case 'workspace':
      return <Workspace3DIcon />;
    case 'ai-search':
      return <Search3DIcon />;
    case 'settings':
      return <Settings3DIcon />;
    default:
      return <RealisticGeneric3DIconComponent app={app} />;
  }
});

// -------------------------------------------------------------
// Live Mini Calendar Grid Helper for Stack Widget
// -------------------------------------------------------------
const MiniCalendarGrid = memo(() => {
  const date = new Date();
  const currentDay = date.getDate();
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = date.toLocaleString('en-US', { month: 'short' });
  
  const daysArray = [];
  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }
  
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  return (
    <div className="flex flex-col gap-1 w-full max-w-[130px] shrink-0 font-sans select-none bg-slate-50 border border-slate-150 p-2 rounded-2xl dark:bg-black/25 dark:border-white/10 dark:shadow-inner">
      <div className="text-[10px] font-extrabold text-red-500 dark:text-rose-400 uppercase tracking-widest leading-none mb-1 shadow-sm text-center">
        {monthName} {year}
      </div>
      <div className="grid grid-cols-7 gap-y-[1px] text-center">
        {weekDays.map((wd, i) => (
          <span key={i} className="text-[7.5px] font-bold text-slate-400 dark:text-white/40">{wd}</span>
        ))}
        {daysArray.slice(0, 21).map((d, idx) => (
          <div key={idx} className="flex items-center justify-center h-3.5 w-3.5 mx-auto">
            {d ? (
              <span className={`text-[8px] font-bold flex items-center justify-center w-3 h-3 rounded-full ${d === currentDay ? 'bg-red-500 text-white shadow-[0_0_6px_rgba(239,68,68,0.5)] font-black' : 'text-slate-700 dark:text-white/80'}`}>
                {d}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// ClockWidget - Premium Dashboard clock and status ring
// -------------------------------------------------------------
const ClockWidget = memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const dayPercentage = ((currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds()) / 86400) * 100;
  
  return (
    <div className="w-full relative group select-none">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-rose-500/10 rounded-[2.2rem] blur-xl transition-all duration-700 group-hover:blur-2xl opacity-80" />
      <div className="relative bg-white/40 dark:bg-black/35 backdrop-blur-[45px] border border-white/20 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-[2.2rem] p-6 flex flex-col justify-between overflow-hidden min-h-[15.5rem]">
        <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 dark:bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-center w-full relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.18em] uppercase text-slate-500 dark:text-neutral-450">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
              {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-8 h-8 -rotate-90">
              <circle cx="16" cy="16" r="13" className="stroke-slate-200 dark:stroke-white/10 fill-none" strokeWidth="2.5" />
              <circle cx="16" cy="16" r="13" className="stroke-indigo-500 fill-none" strokeWidth="2.5" strokeDasharray="81.68" strokeDashoffset={81.68 - (81.68 * dayPercentage) / 100} strokeLinecap="round" />
            </svg>
            <Clock className="w-3.5 h-3.5 absolute text-indigo-500 dark:text-indigo-400" />
          </div>
        </div>
        
        <div className="my-auto py-2 flex flex-col relative z-10">
          <h1 className="text-6xl font-light tracking-tighter text-slate-900 dark:text-white leading-none flex items-baseline">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            <span className="text-[10px] font-bold text-indigo-500 dark:text-rose-450 ml-2 animate-ping">●</span>
          </h1>
          <span className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-white/40 mt-1 uppercase">
            EST ZONE • ACTIVE REFRESH SEC: {currentTime.getSeconds().toString().padStart(2, '0')}
          </span>
        </div>
        
        <div className="flex items-center gap-2.5 bg-slate-100/60 dark:bg-white/10 px-4 py-2 rounded-2xl w-fit border border-slate-200/50 dark:border-white/10 shadow-sm backdrop-blur-md relative z-10">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-yellow-300 animate-pulse" />
          <span className="text-[10px] font-extrabold tracking-[0.1em] uppercase text-slate-700 dark:text-white/95">{getGreeting()}</span>
        </div>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// WorkspaceOverviewWidget - Real-time Google Calendar & Chat Alerts
// -------------------------------------------------------------
const WorkspaceOverviewWidget = memo(({ onNavigate }: { onNavigate: (tab: any) => void }) => {
  const [user, setUser] = useState<any>(auth.currentUser);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [spaces, setSpaces] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const loadWorkspaceSummary = () => {
      const storedEvent = localStorage.getItem('workspace_next_event');
      const storedUnread = localStorage.getItem('workspace_unread_chat_messages');
      const storedSpaces = localStorage.getItem('workspace_spaces_list');
      const storedEventsList = localStorage.getItem('workspace_events_list');

      if (storedEventsList) {
        try {
          const parsedList = JSON.parse(storedEventsList);
          if (parsedList && parsedList.length > 0) {
            setNextEvent(parsedList[0]);
          } else {
            setNextEvent(null);
          }
        } catch (e) {
          setNextEvent(null);
        }
      } else if (storedEvent) {
        try {
          setNextEvent(JSON.parse(storedEvent));
        } catch (e) {
          setNextEvent(null);
        }
      } else if (auth.currentUser) {
        // Fallback default simulator next event
        setNextEvent({
          summary: '🚀 RabbyOS v2.0 Tech Launch Sync',
          start: { dateTime: new Date(Date.now() + 36000 * 2 * 1000).toISOString() }
        });
      } else {
        setNextEvent(null);
      }

      if (storedSpaces) {
        try {
          const parsedSpaces = JSON.parse(storedSpaces);
          setSpaces(parsedSpaces);
          const totalUnread = parsedSpaces.reduce((acc: number, s: any) => acc + (s.unreadCount || 0), 0);
          setUnreadCount(totalUnread);
        } catch (e) {
          setUnreadCount(3);
        }
      } else if (auth.currentUser) {
        setUnreadCount(3);
      } else {
        setUnreadCount(0);
      }
    };

    loadWorkspaceSummary();
    const interval = setInterval(loadWorkspaceSummary, 2500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getFormattedEventTime = () => {
    if (!nextEvent) return '';
    const start = nextEvent.start?.dateTime ? new Date(nextEvent.start.dateTime) : (nextEvent.start?.date ? new Date(nextEvent.start.date) : null);
    if (!start) return 'All Day';
    return start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFormattedEventDate = () => {
    if (!nextEvent) return '';
    const start = nextEvent.start?.dateTime ? new Date(nextEvent.start.dateTime) : (nextEvent.start?.date ? new Date(nextEvent.start.date) : null);
    if (!start) return '';
    return start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full relative group select-none cursor-pointer" onClick={() => onNavigate('workspace')}>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/15 rounded-[2.2rem] blur-xl transition-all duration-700 group-hover:blur-2xl opacity-80" />
      <div className="relative bg-white/40 dark:bg-black/35 backdrop-blur-[45px] border border-white/20 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-[2.2rem] p-6 flex flex-col justify-between overflow-hidden min-h-[15.5rem] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        
        {/* Abstract glowing graphics */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center w-full relative z-10">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black tracking-[0.18em] uppercase text-emerald-600 dark:text-emerald-400">
              Workspace Hub
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
              Overview Summary
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              <span>{user.isAnonymous ? 'Guest Sim' : 'Connected'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/20 px-2.5 py-1 rounded-full text-[9px] font-bold text-amber-600 dark:text-amber-400">
              <Lock className="w-3 h-3" />
              <span>Offline/Locked</span>
            </div>
          )}
        </div>

        {/* Dynamic Inner Content */}
        <div className="flex-1 flex flex-col justify-center my-3 relative z-10 text-left">
          {user ? (
            <div className="space-y-3.5">
              {/* Next Event Section */}
              <div className="p-3 bg-white/30 dark:bg-zinc-950/40 rounded-2xl border border-white/20 dark:border-white/5 flex items-center justify-between gap-3 shadow-sm hover:bg-white/40 dark:hover:bg-zinc-950/60 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-500 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[8.5px] font-black uppercase text-red-500 tracking-wider">Next Event</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate leading-snug">
                      {nextEvent ? nextEvent.summary : 'No scheduled events'}
                    </h4>
                    {nextEvent && (
                      <p className="text-[9.5px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                        {getFormattedEventDate()} • {getFormattedEventTime()}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-white/40 shrink-0" />
              </div>

              {/* Chat Unread Messages Count Section */}
              <div className="p-3 bg-white/30 dark:bg-zinc-950/40 rounded-2xl border border-white/20 dark:border-white/5 flex items-center justify-between gap-3 shadow-sm hover:bg-white/40 dark:hover:bg-zinc-950/60 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 shrink-0 relative">
                    <MessageSquare className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    )}
                  </div>
                  <div className="overflow-hidden mb-[1px]">
                    <span className="text-[8.5px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Unread Alerts</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate leading-snug">
                      {unreadCount > 0 ? `${unreadCount} unread Chat messages` : 'No unread messages'}
                    </h4>
                    <p className="text-[9.5px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {unreadCount > 0 ? 'Urgent workspace communications pending' : 'All spaces read'}
                    </p>
                  </div>
                </div>
                <motion.div 
                  className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black text-white shrink-0 ${unreadCount > 0 ? 'bg-red-500 shadow-md shadow-red-500/20' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}
                  animate={{ scale: unreadCount > 0 ? [1, 1.1, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  {unreadCount}
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 space-y-2 border border-slate-200/50 dark:border-white/5 bg-slate-100/30 dark:bg-white/5 rounded-2xl">
              <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Workspace Not Linked</h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 max-w-[200px]">
                  Unlock live events, calendars, & unread chat indicators by connecting your account.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center bg-slate-100/65 dark:bg-white/10 px-4 py-2.5 rounded-2xl w-full border border-slate-200/50 dark:border-white/10 shadow-sm backdrop-blur-md relative z-10">
          <span className="text-[10px] font-extrabold tracking-[0.05em] uppercase text-slate-700 dark:text-zinc-300">
            {user ? 'Launch Workspace Hub' : 'Connect Now'}
          </span>
          <ChevronRight className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        </div>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// SmartStackWidget - Fluid bento slide elements
// -------------------------------------------------------------
const SmartStackWidget = memo(({ onNavigate }: { onNavigate: (tab: any) => void }) => {
  const [currentWidget, setCurrentWidget] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentWidget((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHovered]);

  return (
    <div 
      className="w-full min-h-[9rem] bg-white/45 dark:bg-black/35 rounded-[2.2rem] backdrop-blur-[45px] border border-white/20 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden relative cursor-pointer group transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {currentWidget === 0 && (
          <motion.div
            key="calendar-comp"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="absolute inset-0 p-5 flex items-center justify-between"
            onClick={() => onNavigate('calendar')}
          >
            <div className="flex flex-col justify-between h-full py-0.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-slate-500 dark:text-neutral-400 font-extrabold uppercase text-[9px] tracking-widest">Schedule</h3>
              </div>
              <div className="mt-2 text-left">
                <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-widest block">Up Next</span>
                <h2 className="text-slate-800 dark:text-white font-bold text-base sm:text-lg leading-snug">Design Sync Review</h2>
                <p className="text-slate-500 dark:text-white/60 text-xs mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  1:00 PM - 2:00 PM
                </p>
              </div>
            </div>
            
            <div className="hidden sm:block border-l border-slate-200/50 dark:border-white/10 h-[85%] mx-4" />
            
            <MiniCalendarGrid />
          </motion.div>
        )}
        
        {currentWidget === 1 && (
          <motion.div
            key="weather-comp"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="absolute inset-0 p-5 flex items-center justify-between"
            onClick={() => onNavigate('weather')}
          >
            <div className="flex flex-col justify-between h-full py-0.5 text-left">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-500">
                  <Cloud className="w-4 h-4" />
                </div>
                <h3 className="text-slate-500 dark:text-neutral-400 font-extrabold uppercase text-[9px] tracking-widest">Cupertino</h3>
              </div>
              
              <div className="mt-2">
                <div className="text-slate-800 dark:text-white text-xs font-bold uppercase tracking-wider">Mostly Sunny</div>
                <span className="text-[10px] text-slate-500 dark:text-white/60 font-semibold block">
                  H: 76°  L: 58° • Haze
                </span>
                <div className="flex items-center gap-2 mt-1.5 text-slate-650 dark:text-white/70 text-[9px] font-mono">
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 py-0.5 px-1.5 rounded-md">
                    <Wind className="w-3 h-3 text-cyan-400" /> 12 mph
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 py-0.5 px-1.5 rounded-md">
                    <Battery className="w-3 h-3 text-emerald-400" /> UV Index: 5
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center pr-3">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md animate-pulse" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-300 to-amber-500 border border-yellow-250 flex items-center justify-center shadow-md relative z-10" />
                <Cloud className="w-7 h-7 text-white absolute -bottom-1 -right-2 drop-shadow-md z-20" />
              </div>
              <h1 className="text-3xl font-extralight tracking-tighter text-slate-900 dark:text-white mt-1.5">72°</h1>
            </div>
          </motion.div>
        )}
        
        {currentWidget === 2 && (
          <motion.div
            key="ai-comp"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="absolute inset-0 p-5 flex flex-col justify-between text-left"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-slate-800 dark:text-white font-bold text-sm flex items-center gap-1 leading-none">
                    Gemini Live
                  </h3>
                  <span className="text-[9px] text-slate-500 dark:text-white/50 font-mono tracking-wider uppercase">ONLINE & ACTIVE</span>
                </div>
              </div>
              
              <div className="flex items-center gap-0.75 h-3 pr-1">
                {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                  <motion.div 
                    key={i} 
                    className="w-[1.5px] bg-gradient-to-t from-indigo-500 to-pink-500 rounded-full"
                    animate={{ height: ['4px', '12px', '4px'] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-slate-500 dark:text-white/70 text-xs font-semibold pl-1 italic">
              "How can I assist your productivity flow today?"
            </p>
            
            <div className="flex gap-2">
              <button onClick={() => onNavigate('voice')} className="bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 active:scale-[0.97] rounded-xl p-1.5 sm:p-2 flex items-center justify-center gap-1.5 flex-1 select-none backdrop-blur-md transition-all border border-slate-200/40 dark:border-white/10">
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[9px] sm:text-[10px] text-slate-800 dark:text-white font-extrabold uppercase tracking-wider">Voice Chat</span>
              </button>
              <button onClick={() => onNavigate('whatsapp')} className="bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 active:scale-[0.97] rounded-xl p-1.5 sm:p-2 flex items-center justify-center gap-1.5 flex-1 select-none backdrop-blur-md transition-all border border-slate-200/40 dark:border-white/10">
                <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[9px] sm:text-[10px] text-slate-800 dark:text-white font-extrabold uppercase tracking-wider">Message</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Widget Pagination Dots */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-25">
        {[0, 1, 2].map(i => (
          <div key={i} className={`w-1 rounded-full transition-all duration-300 ${currentWidget === i ? 'h-3 bg-indigo-500 dark:bg-white' : 'h-1 bg-slate-300 dark:bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// ArenaAiWidget - Model battle bento promotion card
// -------------------------------------------------------------
const ArenaAiWidget = memo(({ onNavigate }: { onNavigate: (tab: any) => void }) => {
  return (
    <div 
      onClick={() => onNavigate('arena-ai')}
      className="w-full h-full min-h-[7.5rem] bg-gradient-to-br from-orange-400 via-pink-500 to-rose-600 rounded-[2.2rem] border border-white/25 dark:border-white/15 shadow-[0_12px_45px_rgba(244,63,94,0.22),inset_0_1px_2px_rgba(255,255,255,0.45)] overflow-hidden relative cursor-pointer group hover:scale-[1.012] active:scale-[0.99] transition-all duration-300"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-15 mix-blend-overlay pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-yellow-300/40 rounded-full blur-2xl group-hover:bg-yellow-300/60 transition-colors duration-500 pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none" />
      
      <div className="absolute inset-0 p-5 flex flex-col justify-between z-10 text-left">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 bg-black/25 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
            <Swords className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-[9px] font-black tracking-widest uppercase text-white shadow-sm">Model Arena</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-450/30 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-450" /> LIVE BATTLE
          </div>
        </div>
        
        <div className="mt-4">
          <h2 className="text-white font-extrabold text-lg leading-tight drop-shadow-md">
            AI Model Arena Battles
          </h2>
          <p className="text-white/90 text-xs font-semibold drop-shadow-sm mt-0.5">
            Compare Gemini, DeepSeek, and Anthropic Claude side-by-side to find the ultimate LLM.
          </p>
        </div>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// QuickAddWidget - Instant navigation to notes, events & camera
// -------------------------------------------------------------
const QuickAddWidget = memo(({ onNavigate }: { onNavigate: (tab: any) => void }) => {
  const handleQuickAddAction = (target: string, actionName?: string) => {
    if (actionName) {
      sessionStorage.setItem(`${target}_action`, actionName);
    }
    onNavigate(target);
  };

  return (
    <div className="w-full min-h-[9rem] bg-white/45 dark:bg-black/35 rounded-[2.2rem] backdrop-blur-[45px] border border-white/20 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden p-5 flex flex-col justify-between relative group transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-500/5 dark:bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-2 pb-1 relative z-10">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-rose-450 animate-pulse" />
          <h3 className="text-slate-500 dark:text-neutral-450 font-black tracking-widest uppercase text-[9px]">Quick Add</h3>
        </div>
        <span className="text-[8px] font-mono bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-600 dark:text-indigo-300 font-bold uppercase tracking-wider">Instant Action</span>
      </div>

      <div className="grid grid-cols-3 gap-3 relative z-10 h-full py-1">
        {/* New Note */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleQuickAddAction('notes', 'new_note')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/10 cursor-pointer transition-colors group flex-1"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black tracking-wide text-slate-700 dark:text-zinc-200 uppercase leading-tight text-center">New Note</span>
        </motion.button>

        {/* New Calendar Event */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleQuickAddAction('calendar', 'new_event')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 dark:border-red-500/10 cursor-pointer transition-colors group flex-1"
        >
          <div className="w-8 h-8 rounded-xl bg-red-500/25 flex items-center justify-center text-red-500 dark:text-rose-400 mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black tracking-wide text-slate-700 dark:text-zinc-200 uppercase leading-tight text-center flex-1 self-center text-center">New Event</span>
        </motion.button>

        {/* Camera */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleQuickAddAction('camera')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-zinc-500/10 hover:bg-zinc-500/15 border border-zinc-500/20 dark:border-zinc-500/10 cursor-pointer transition-colors group flex-1"
        >
          <div className="w-8 h-8 rounded-xl bg-zinc-500/25 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black tracking-wide text-slate-700 dark:text-zinc-200 uppercase leading-tight text-center">Camera</span>
        </motion.button>
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// Main Home Screen Grid
// -------------------------------------------------------------
export function Home({ onNavigate, recentApps }: HomeProps) {
  const { iconShape, iconSize } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const getIconShapeClass = () => {
    switch (iconShape) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-lg';
      case 'squircle': default: return 'rounded-[1.45rem]';
    }
  };

  const getIconSizeClass = () => {
    switch (iconSize) {
      case 'small': return 'w-[52px] h-[52px]';
      case 'large': return 'w-[72px] h-[72px]';
      case 'medium': default: return 'w-[62px] h-[62px]';
    }
  };

  const filteredApps = useMemo(() => {
    if (!searchQuery) {
      return APPS.filter(app => [
        'camera', 'gallery', 'image', 'file-manager', 'browser', 'unblocker', 'youtube', 'whatsapp', 
        'settings', 'calculator', 'weather', 'calendar', 'clock', 'music', 'maps', 'contacts', 
        'downloader', 'workspace', 'media-player'
      ].includes(app.id));
    }
    return APPS.filter(app => app.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.id.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  return (
    <motion.div 
      className="flex-1 overflow-y-auto p-2 sm:p-4 pt-16 pb-32 relative z-10 custom-scrollbar h-full w-full"
    >
      <div className="w-full h-full relative">
        
        {/* Persistent Search Bar */}
        <div className="w-full relative z-30 mb-6 px-1 sm:px-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 dark:text-indigo-300" />
            <input
              type="text"
              placeholder="Search apps and services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/30 dark:bg-black/35 border border-white/30 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-11 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/50 hover:text-indigo-500 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {!searchQuery ? (
          <>
            {/* Bento Grid Widgets layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <ClockWidget />
              <WorkspaceOverviewWidget onNavigate={onNavigate} />
              <div className="flex flex-col gap-4 sm:gap-6 md:col-span-2 lg:col-span-1">
                <QuickAddWidget onNavigate={onNavigate} />
                <SmartStackWidget onNavigate={onNavigate} />
                <ArenaAiWidget onNavigate={onNavigate} />
              </div>
            </div>

            {/* Recently Used Apps Carousel */}
            {recentApps && recentApps.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 pl-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                  <h3 className="text-slate-600 dark:text-white/60 font-black text-[10px] tracking-widest uppercase">Recently Active</h3>
                </div>
                <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2.5 pt-1.5 px-1.5">
                  {recentApps.map((app, index) => (
                    <motion.button
                      key={app.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ delay: Math.min(index * 0.04, 0.4), type: 'spring', stiffness: 350, damping: 18 }}
                      onClick={() => onNavigate(app.id)}
                      className="flex flex-col items-center space-y-2 group flex-shrink-0 w-[62px] sm:w-[72px]"
                    >
                      <div className={`${getIconSizeClass()} ${getIconShapeClass()} overflow-hidden transition-all duration-300 select-none cursor-pointer flex items-center justify-center shadow-lg relative`}>
                        <Render3DIcon appId={app.id} app={app} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-white/95 truncate w-full text-center drop-shadow-sm tracking-wide group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors uppercase text-[9px]">{app.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mb-6 px-1.5">
            <h3 className="text-slate-800 dark:text-white/70 font-semibold text-sm mb-4">Search Results</h3>
            {filteredApps.length === 0 && (
              <div className="text-slate-500 dark:text-white/50 text-center py-8">No applications found for "{searchQuery}"</div>
            )}
          </div>
        )}

        {/* Home Screen Apps Section Header */}
        {!searchQuery && (
          <div className="flex items-center gap-2 mb-3 pl-1.5 mt-8 border-b border-slate-200/50 dark:border-white/5 pb-2">
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-slate-600 dark:text-white/60 font-black text-[10px] tracking-widest uppercase">System Dashboard</h3>
          </div>
        )}

        {/* Home Screen Apps Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-y-7 gap-x-3 sm:gap-x-5 mb-12 mt-4 px-1 sm:px-2">
          {filteredApps.map((app, index) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              transition={{ delay: Math.min(index * 0.02, 0.25), type: 'spring', stiffness: 350, damping: 18 }}
              onClick={() => onNavigate(app.id)}
              className="flex flex-col items-center space-y-2 group"
            >
              <div className={`${getIconSizeClass()} ${getIconShapeClass()} overflow-hidden transition-all duration-300 select-none cursor-pointer flex items-center justify-center shadow-lg relative`}>
                <Render3DIcon appId={app.id} app={app} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-800 dark:text-white/95 truncate w-full text-center drop-shadow-sm tracking-wide group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">{app.name}</span>
            </motion.button>
          ))}
        </div>

      </div>
    </motion.div>
  );
}
