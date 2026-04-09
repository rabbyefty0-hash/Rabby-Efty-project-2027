import React, { useState, useEffect } from 'react';
import { ChevronLeft, CloudRain, Sun, Wind, Droplets, MapPin, Loader2, Cloud, CloudLightning, CloudSnow } from 'lucide-react';
import { motion } from 'motion/react';

interface WeatherProps {
  onBack: () => void;
}

export function Weather({ onBack }: WeatherProps) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        
        // Reverse geocoding for city name
        let city = "Current Location";
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const geoData = await geoRes.json();
          city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || "Current Location";
        } catch (e) {
          console.error("Geocoding failed", e);
        }

        const current = data.current_weather;
        const daily = data.daily;
        
        const getWeatherIcon = (code: number) => {
          if (code <= 3) return Sun;
          if (code <= 48) return Cloud;
          if (code <= 67) return CloudRain;
          if (code <= 77) return CloudSnow;
          if (code <= 99) return CloudLightning;
          return Sun;
        };

        const getWeatherCondition = (code: number) => {
          if (code === 0) return 'Clear Sky';
          if (code <= 3) return 'Partly Cloudy';
          if (code <= 48) return 'Foggy';
          if (code <= 67) return 'Rainy';
          if (code <= 77) return 'Snowy';
          if (code <= 99) return 'Thunderstorm';
          return 'Clear';
        };

        const forecast = daily.time.slice(1, 6).map((timeStr: string, index: number) => {
          const date = new Date(timeStr);
          return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            temp: Math.round(daily.temperature_2m_max[index + 1]),
            icon: getWeatherIcon(daily.weathercode[index + 1])
          };
        });

        setWeather({
          temp: Math.round(current.temperature),
          condition: getWeatherCondition(current.weathercode),
          location: city,
          humidity: data.hourly.relative_humidity_2m[0] || 50,
          wind: Math.round(current.windspeed),
          forecast
        });
      } catch (err) {
        console.error("Error fetching weather", err);
        setError("Failed to fetch weather data.");
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.error("Geolocation error", err);
          // Fallback to a default location (e.g., London)
          fetchWeather(51.5074, -0.1278);
        }
      );
    } else {
      // Fallback
      fetchWeather(51.5074, -0.1278);
    }
  }, []);

  return (
    <div 
      className="flex flex-col h-full bg-gradient-to-b from-blue-400 to-blue-600 text-white"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        if (info.offset.x > 50 || info.velocity.x > 500) {
          onBack();
        }
      }}
    >
      <div className="flex items-center p-4 pt-12">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold ml-2">Weather</h1>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-white/80">Locating & fetching weather...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p>{error}</p>
        </div>
      ) : weather ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar max-w-2xl mx-auto w-full"
        >
          <div className="flex items-center justify-center space-x-2 mb-8">
            <MapPin className="w-5 h-5 opacity-80" />
            <h2 className="text-2xl font-medium">{weather.location}</h2>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 min-h-[200px]">
            {weather.condition.includes('Rain') ? (
              <CloudRain className="w-32 h-32 mb-6 text-blue-200 drop-shadow-lg" />
            ) : weather.condition.includes('Cloud') ? (
              <Cloud className="w-32 h-32 mb-6 text-gray-200 drop-shadow-lg" />
            ) : (
              <Sun className="w-32 h-32 mb-6 text-yellow-300 drop-shadow-lg" />
            )}
            <div className="text-8xl font-light tracking-tighter mb-2">{weather.temp}°</div>
            <div className="text-2xl font-medium opacity-90">{weather.condition}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 my-8 bg-white/10 rounded-3xl p-6 backdrop-blur-md shrink-0">
            <div className="flex items-center space-x-3">
              <Droplets className="w-6 h-6 text-blue-200" />
              <div>
                <div className="text-sm opacity-70">Humidity</div>
                <div className="font-semibold">{weather.humidity}%</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Wind className="w-6 h-6 text-blue-200" />
              <div>
                <div className="text-sm opacity-70">Wind</div>
                <div className="font-semibold">{weather.wind} km/h</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-3xl p-6 backdrop-blur-md shrink-0 mb-8">
            <h3 className="text-sm font-medium opacity-70 mb-4 uppercase tracking-wider">5-Day Forecast</h3>
            <div className="flex justify-between">
              {weather.forecast.map((day: any, i: number) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <span className="text-sm font-medium">{day.day}</span>
                  <day.icon className="w-6 h-6 text-yellow-300" />
                  <span className="font-semibold">{day.temp}°</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
