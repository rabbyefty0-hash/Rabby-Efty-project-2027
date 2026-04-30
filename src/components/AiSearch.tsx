import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe, Sparkles, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';

interface AiSearchProps {
  onBack?: () => void;
}

export function AiSearch({ onBack }: AiSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setResult(null);
    setSources([]);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key missing');
      
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Search the web and provide a comprehensive, up-to-date answer for: "${query}"`,
        tools: [{ googleSearch: {} }]
      } as any);

      if (response.text) {
        setResult(response.text);
      } else {
        setResult("No results found.");
      }

      // Extract sources if available
      const candidate = response.candidates?.[0];
      if (candidate?.groundingMetadata?.groundingChunks) {
        const extractedSources = candidate.groundingMetadata.groundingChunks
          .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
          .map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title
          }));
        setSources(extractedSources);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full relative z-10 bg-zinc-950 overflow-hidden pt-12 pb-24"
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
      
      {/* Header */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center space-x-3 shadow-sm z-20">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2 text-white">
          <Globe className="w-5 h-5 text-blue-400" />
          <h1 className="font-semibold text-lg tracking-tight">AI Web Search</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative flex items-center bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-xl">
              <Search className="w-6 h-6 text-white/40 ml-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the web with AI..."
                className="flex-1 bg-transparent border-none text-white px-4 py-3 outline-none placeholder:text-white/40 text-lg"
                disabled={isSearching}
              />
              <motion.button
                type="submit"
                whileHover={{ scale: query.trim() && !isSearching ? 1.02 : 1 }}
                whileTap={{ scale: query.trim() && !isSearching ? 0.96 : 1 }}
                disabled={!query.trim() || isSearching}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2 shadow-lg"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-2xl backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          {/* Results Area */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-white/10">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-medium text-white">AI Summary</h2>
                  </div>
                  <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-blue-400">
                    <Markdown>{result}</Markdown>
                  </div>
                </div>

                {sources.length > 0 && (
                  <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">Sources</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sources.map((source, idx) => (
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                        >
                          <div className="p-2 bg-white/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                            <Globe className="w-4 h-4 text-white/60 group-hover:text-blue-400" />
                          </div>
                          <span className="flex-1 text-sm text-white/80 truncate">{source.title}</span>
                          <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60" />
                        </motion.a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !isSearching && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-white/30 space-y-4">
              <Globe className="w-16 h-16 opacity-50" />
              <p className="text-center max-w-sm">
                Enter a query above to search the web. The AI will analyze top results and provide a comprehensive summary.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
