import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Clock as ClockIcon, AlarmClock, Timer, Hourglass, Globe, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClockProps {
  onBack: () => void;
}

export function Clock({ onBack }: ClockProps) {
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('world');

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Timer state
  const [timerDuration, setTimerDuration] = useState(60); // default 1 min
  const [timerRemaining, setTimerRemaining] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime(prev => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining(prev => prev - 1);
      }, 1000);
    } else if (timerRemaining === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerRemaining]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'world', icon: Globe, label: 'World Clock' },
    { id: 'alarm', icon: AlarmClock, label: 'Alarm' },
    { id: 'stopwatch', icon: Timer, label: 'Stopwatch' },
    { id: 'timer', icon: Hourglass, label: 'Timer' }
  ];

  return (
    <motion.div 
      className="flex flex-col h-full bg-black text-white"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        if (info.offset.x > 50 || info.velocity.x > 500) {
          onBack();
        }
      }}
    >
      <div className="flex items-center p-4 pt-12 bg-zinc-900 shadow-sm z-10">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold ml-2">Clock</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'world' && (
            <motion.div 
              key="world"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-center">
                <div className="text-7xl font-light tracking-tighter mb-4 text-orange-500">
                  {formatTime(time).split(' ')[0]}
                  <span className="text-3xl font-medium ml-2 text-white/50">{formatTime(time).split(' ')[1]}</span>
                </div>
                <div className="text-xl font-medium text-white/70 tracking-wide">{formatDate(time)}</div>
              </div>

              <div className="mt-16 w-full max-w-sm space-y-4">
                <h3 className="text-lg font-semibold mb-6 flex items-center text-orange-500">
                  <Globe className="w-5 h-5 mr-2" />
                  World Clock
                </h3>
                <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <div>
                    <div className="text-sm text-white/50 mb-1">Today, +0HRS</div>
                    <div className="text-xl font-medium">Local Time</div>
                  </div>
                  <div className="text-2xl font-light">{formatTime(time).split(':')[0]}:{formatTime(time).split(':')[1]} {formatTime(time).split(' ')[1]}</div>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <div>
                    <div className="text-sm text-white/50 mb-1">Tomorrow, +3HRS</div>
                    <div className="text-xl font-medium">New York</div>
                  </div>
                  <div className="text-2xl font-light">
                    {new Date(time.getTime() + 3 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'stopwatch' && (
            <motion.div 
              key="stopwatch"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-7xl font-light tracking-tighter mb-12 text-orange-500 tabular-nums">
                {formatStopwatch(stopwatchTime)}
              </div>
              
              <div className="flex gap-6 mb-12">
                <button 
                  onClick={() => {
                    if (isStopwatchRunning) {
                      setLaps([stopwatchTime, ...laps]);
                    } else {
                      setStopwatchTime(0);
                      setLaps([]);
                    }
                  }}
                  className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                >
                  {isStopwatchRunning ? 'Lap' : 'Reset'}
                </button>
                <button 
                  onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                    isStopwatchRunning ? 'bg-red-900/50 text-red-500 hover:bg-red-900/70' : 'bg-green-900/50 text-green-500 hover:bg-green-900/70'
                  }`}
                >
                  {isStopwatchRunning ? 'Stop' : 'Start'}
                </button>
              </div>

              <div className="w-full max-w-sm space-y-2">
                {laps.map((lap, i) => (
                  <div key={i} className="flex justify-between p-4 border-b border-zinc-800 text-lg">
                    <span className="text-white/50">Lap {laps.length - i}</span>
                    <span className="tabular-nums">{formatStopwatch(lap)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'timer' && (
            <motion.div 
              key="timer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-7xl font-light tracking-tighter mb-12 text-orange-500 tabular-nums">
                {formatTimer(timerRemaining)}
              </div>

              {!isTimerRunning && timerRemaining === timerDuration && (
                <div className="flex gap-4 mb-12">
                  {[1, 5, 10, 15, 30].map(min => (
                    <button
                      key={min}
                      onClick={() => {
                        setTimerDuration(min * 60);
                        setTimerRemaining(min * 60);
                      }}
                      className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex gap-6">
                <button 
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerRemaining(timerDuration);
                  }}
                  className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (timerRemaining > 0) {
                      setIsTimerRunning(!isTimerRunning);
                    }
                  }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                    isTimerRunning ? 'bg-orange-900/50 text-orange-500 hover:bg-orange-900/70' : 'bg-green-900/50 text-green-500 hover:bg-green-900/70'
                  }`}
                >
                  {isTimerRunning ? 'Pause' : (timerRemaining > 0 ? 'Start' : 'Done')}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'alarm' && (
            <motion.div 
              key="alarm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center"
            >
              <AlarmClock className="w-24 h-24 text-zinc-800 mb-6" />
              <h2 className="text-2xl font-medium text-white/50">No Alarms</h2>
              <p className="text-white/30 mt-2">Tap + to add an alarm</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-around p-4 bg-zinc-900 border-t border-zinc-800 pb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'text-orange-500' : 'text-white/50 hover:text-white/80'}`}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
