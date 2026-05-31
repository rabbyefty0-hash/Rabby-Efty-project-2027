import React, { createContext, useContext, useState, useEffect } from 'react';

interface BatteryHistoryItem {
  time: string;
  level: number;
}

interface BatteryContextType {
  batteryLevel: number;
  isCharging: boolean;
  batteryHistory: BatteryHistoryItem[];
}

const BatteryContext = createContext<BatteryContextType | undefined>(undefined);

export const BatteryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [batteryHistory, setBatteryHistory] = useState<BatteryHistoryItem[]>([]);

  // Function to generate reasonable simulated history if none exists
  const getInitialHistory = (currentLevel: number, charging: boolean): BatteryHistoryItem[] => {
    const stored = localStorage.getItem('app_battery_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse battery history", e);
      }
    }

    // Generate fallback history based on current level
    const history: BatteryHistoryItem[] = [];
    const now = Date.now();
    for (let i = 9; i >= 0; i--) {
      const timeOffset = i * 30 * 60 * 1000; // 30 mins spacing
      const timeLabel = new Date(now - timeOffset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let calculatedLevel = currentLevel;
      if (charging) {
        calculatedLevel = Math.max(10, currentLevel - Math.round(i * 2.5));
      } else {
        calculatedLevel = Math.min(100, currentLevel + Math.round(i * 1.5));
      }
      history.push({ time: timeLabel, level: calculatedLevel });
    }
    return history;
  };

  useEffect(() => {
    const updateHandler = (battery: any) => {
      const level = Math.round(battery.level * 100);
      const charging = battery.charging;
      setBatteryLevel(level);
      setIsCharging(charging);

      setBatteryHistory(prev => {
        const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // Check if the last item is the same time to avoid spam
        if (prev.length > 0 && prev[prev.length - 1].time === nowLabel) {
          const updated = [...prev];
          updated[updated.length - 1] = { time: nowLabel, level };
          localStorage.setItem('app_battery_history', JSON.stringify(updated));
          return updated;
        }
        const updated = [...prev, { time: nowLabel, level }].slice(-15); // keep last 15 points
        localStorage.setItem('app_battery_history', JSON.stringify(updated));
        return updated;
      });
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const level = Math.round(battery.level * 100);
        const charging = battery.charging;
        setBatteryLevel(level);
        setIsCharging(charging);

        // Populate initial history if empty
        setBatteryHistory(getInitialHistory(level, charging));

        battery.addEventListener('levelchange', () => updateHandler(battery));
        battery.addEventListener('chargingchange', () => updateHandler(battery));

        return () => {
          battery.removeEventListener('levelchange', () => updateHandler(battery));
          battery.removeEventListener('chargingchange', () => updateHandler(battery));
        };
      }).catch((err: any) => {
        console.warn("Battery status not available, running fallback:", err);
        // Fallback for environments where getBattery is unsupported
        setBatteryHistory(getInitialHistory(85, false));
      });
    } else {
      // Non-browser fallback or unsupported environment
      setBatteryHistory(getInitialHistory(85, false));
    }
  }, []);

  return (
    <BatteryContext.Provider value={{ batteryLevel, isCharging, batteryHistory }}>
      {children}
    </BatteryContext.Provider>
  );
};

export const useBattery = () => {
  const context = useContext(BatteryContext);
  if (!context) {
    throw new Error('useBattery must be used within a BatteryProvider');
  }
  return context;
};
