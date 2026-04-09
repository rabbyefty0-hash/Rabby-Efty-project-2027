import React, { useState, useEffect } from 'react';
import { ChevronLeft, Users, TrendingUp, DollarSign, Activity, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const API_KEY = 'hYQDJbY5oIUWmtSv8NMu5Q0d96hBwe6';
// Using corsproxy.io to bypass CORS restrictions for the SMM panel API
const API_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://followeran.com/api/v2');

interface Service {
  service: string;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
}

interface FolloweranProps {
  onBack: () => void;
}

export function Followeran({ onBack }: FolloweranProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchBalance();
    fetchServices();
  }, []);

  const makeApiRequest = async (action: string, params: Record<string, string> = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (action !== 'services') {
        queryParams.append('key', API_KEY);
      }
      queryParams.append('action', action);
      
      for (const [key, value] of Object.entries(params)) {
        queryParams.append(key, value);
      }

      const targetUrl = `https://panel.smmflw.com/api/v2?${queryParams.toString()}`;
      const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(targetUrl);

      const response = await fetch(proxyUrl);
      const text = await response.text();
      
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed === 'string') {
          return { error: parsed };
        }
        return parsed;
      } catch (e) {
        // If it's not JSON, it might be a plain string error
        return { error: text.replace(/"/g, '') };
      }
    } catch (error) {
      console.error(`API Error (${action}):`, error);
      throw error;
    }
  };

  const fetchBalance = async () => {
    try {
      const data = await makeApiRequest('balance');
      if (data.balance) {
        setBalance(data.balance);
        setCurrency(data.currency || 'USD');
      }
    } catch (error) {
      console.error("Failed to fetch balance");
    }
  };

  const fetchServices = async () => {
    try {
      const data = await makeApiRequest('services');
      console.log('Services response:', data);
      if (Array.isArray(data)) {
        setServices(data);
        const uniqueCategories = Array.from(new Set(data.map(s => s.category)));
        setCategories(uniqueCategories);
        if (uniqueCategories.length > 0) {
          setSelectedCategory(uniqueCategories[0]);
        }
      } else {
        console.error('Services data is not an array:', data);
      }
    } catch (error) {
      console.error("Failed to fetch services", error);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedService('');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !link || !quantity) {
      setStatusMsg({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const data = await makeApiRequest('add', {
        service: selectedService,
        link: link,
        quantity: quantity
      });

      if (data.error) {
        setStatusMsg({ type: 'error', text: data.error });
      } else if (data.order) {
        setStatusMsg({ type: 'success', text: `Order placed successfully! ID: ${data.order}` });
        setLink('');
        setQuantity('');
        fetchBalance(); // Refresh balance
      } else {
        setStatusMsg({ type: 'error', text: 'Unknown response from server' });
      }
    } catch (error) {
      setStatusMsg({ type: 'error', text: 'Failed to place order. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(s => s.category === selectedCategory);
  const currentServiceDetails = services.find(s => s.service === selectedService);

  return (
    <div 
      className="h-full bg-gray-50 dark:bg-zinc-900 text-black dark:text-white flex flex-col font-sans overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      <div 
        className="absolute inset-y-0 left-0 w-4 z-50"
        onPointerDown={(e) => {
          const startX = e.clientX;
          const handlePointerUp = (upEvent: PointerEvent) => {
            if (upEvent.clientX - startX > 50) {
              onBack();
            }
            window.removeEventListener('pointerup', handlePointerUp);
          };
          window.addEventListener('pointerup', handlePointerUp);
        }}
      />
      {/* Header */}
      <div className="pt-12 pb-4 px-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-white/10 flex-shrink-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Followeran</h1>
        </div>
        
        {balance !== null && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium border border-green-200 dark:border-green-800/50">
            <DollarSign className="w-4 h-4" />
            {balance} {currency}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Status Message */}
        {statusMsg && (
          <div className={`p-4 rounded-2xl flex items-start gap-3 ${
            statusMsg.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
            <p className="text-sm font-medium">{statusMsg.text}</p>
          </div>
        )}

        {/* Order Form */}
        <div className="bg-white dark:bg-zinc-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-white/5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            New Order
          </h2>
          
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select 
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                disabled={categories.length === 0}
              >
                {categories.length === 0 ? (
                  <option>Loading categories...</option>
                ) : (
                  categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))
                )}
              </select>
            </div>

            {/* Service */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Service</label>
              <select 
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                disabled={!selectedCategory || filteredServices.length === 0}
              >
                <option value="">Select a service</option>
                {filteredServices.map(srv => (
                  <option key={srv.service} value={srv.service}>
                    {srv.service} - {srv.name} (${srv.rate})
                  </option>
                ))}
              </select>
            </div>

            {/* Service Details */}
            {currentServiceDetails && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30 text-xs text-blue-800 dark:text-blue-300 flex justify-between">
                <span>Min: {currentServiceDetails.min}</span>
                <span>Max: {currentServiceDetails.max}</span>
                <span className="font-semibold">Rate: ${currentServiceDetails.rate} / 1000</span>
              </div>
            )}

            {/* Link */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Link</label>
              <input 
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
              <input 
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1000"
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Price Calculation */}
            {currentServiceDetails && quantity && !isNaN(Number(quantity)) && (
              <div className="text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Charge: <span className="text-blue-600 dark:text-blue-400 text-lg">${((Number(quantity) / 1000) * Number(currentServiceDetails.rate)).toFixed(4)}</span>
              </div>
            )}

            {/* Submit */}
            <button 
              type="submit"
              disabled={loading || !selectedService || !link || !quantity}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
