import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Navigation, Search, Layers, Crosshair } from 'lucide-react';
import { motion } from 'motion/react';

interface MapsProps {
  onBack: () => void;
}

export function MapsApp({ onBack }: MapsProps) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [destination, setDestination] = useState('');
  const [showDirections, setShowDirections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unknown'>('unknown');

  useEffect(() => {
    checkPermissionAndLocate();
  }, []);

  const checkPermissionAndLocate = async () => {
    setLoading(true);
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(result.state);
        result.onchange = () => setPermissionStatus(result.state);
      } catch (e) {
        console.error("Permission query error", e);
      }
    }

    if ("geolocation" in navigator) {
      // Request foreground location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setPermissionStatus('granted');
          setLoading(false);
        },
        (err) => {
          console.error("Geolocation error", err);
          setPermissionStatus('denied');
          // Fallback to San Francisco
          setLocation({ lat: 37.7749, lon: -122.4194 });
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocation({ lat: 37.7749, lon: -122.4194 });
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Simple geocoding using Nominatim
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setLocation({
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
          });
        }
      })
      .catch(err => console.error("Search failed", err));
  };

  const handleLocateMe = () => {
    checkPermissionAndLocate();
  };

  const toggleDirections = () => {
    setShowDirections(!showDirections);
    if (!showDirections) {
      setDestination(searchQuery);
    }
  };

  const getMapUrl = () => {
    if (!location) return '';
    if (showDirections && destination) {
      // Note: Full turn-by-turn directions in iframe requires Google Maps Embed API with an API key.
      // This is a fallback that opens the standard map with a query, or you can use the standard embed.
      // For a real app, you'd use: https://www.google.com/maps/embed/v1/directions?key=YOUR_API_KEY&origin=${location.lat},${location.lon}&destination=${encodeURIComponent(destination)}
      return `https://maps.google.com/maps?saddr=${location.lat},${location.lon}&daddr=${encodeURIComponent(destination)}&output=embed`;
    }
    return `https://maps.google.com/maps?q=${location.lat},${location.lon}&t=m&z=14&output=embed&iwloc=near`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-900 relative">
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent pt-12 pb-6 px-4 flex items-center gap-3">
        <button 
          onClick={onBack} 
          className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-gray-800 hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <form onSubmit={handleSearch} className="flex-1 relative">
          <input
            type="text"
            value={showDirections ? destination : searchQuery}
            onChange={(e) => showDirections ? setDestination(e.target.value) : setSearchQuery(e.target.value)}
            placeholder={showDirections ? "Enter destination..." : "Search Google Maps"}
            className="w-full bg-white/90 backdrop-blur-md rounded-full py-3 pl-12 pr-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        </form>
      </div>

      {permissionStatus === 'denied' && (
        <div className="absolute top-24 left-4 right-4 z-20 bg-red-500 text-white p-3 rounded-xl shadow-lg text-sm flex items-center justify-between">
          <span>Location access denied. Please enable it in your browser settings.</span>
          <button onClick={() => setPermissionStatus('unknown')} className="underline">Dismiss</button>
        </div>
      )}

      <div className="flex-1 relative bg-gray-200">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {location && (
          <iframe
            title="Google Maps"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={getMapUrl()}
            className="absolute inset-0 w-full h-full border-none"
          />
        )}
      </div>

      <div className="absolute bottom-24 right-4 flex flex-col gap-3 z-10">
        <button 
          className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-gray-800 hover:bg-white transition-colors"
          title="Map Layers"
        >
          <Layers className="w-6 h-6" />
        </button>
        <button 
          onClick={handleLocateMe}
          className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-blue-500 hover:bg-white transition-colors"
          title="My Location"
        >
          <Crosshair className="w-6 h-6" />
        </button>
        <button 
          onClick={toggleDirections}
          className={`p-4 rounded-full shadow-lg transition-colors mt-2 ${showDirections ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          title={showDirections ? "Cancel Directions" : "Directions"}
        >
          <Navigation className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
