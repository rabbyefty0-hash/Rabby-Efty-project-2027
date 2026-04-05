import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Play, Youtube, AlertCircle, Loader2, X } from 'lucide-react';

interface YouTubeAppProps {
  onBack: () => void;
}

interface Video {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
      high: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

export default function YouTubeApp({ onBack }: YouTubeAppProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    // Load some default videos if API key is present
    if (apiKey) {
      searchVideos('technology');
    } else {
      setError('YouTube API key is missing. Please add VITE_YOUTUBE_API_KEY to your environment variables to enable search.');
    }
  }, []);

  const searchVideos = async (query: string) => {
    if (!apiKey) {
      setError('YouTube API key is missing. Please add VITE_YOUTUBE_API_KEY to your environment variables.');
      return;
    }

    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(
          query
        )}&type=video&key=${apiKey}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch videos');
      }

      const data = await response.json();
      setVideos(data.items || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchVideos(searchQuery);
  };

  const renderList = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-[#0f0f0f] text-white"
    >
      <div className="pt-12 pb-4 px-4 flex items-center justify-between bg-[#0f0f0f] z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-white rounded-full hover:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <Youtube className="w-8 h-8 text-red-600" />
          <span className="text-xl font-bold tracking-tighter">YouTube</span>
        </div>
      </div>

      <div className="px-4 pb-4 sticky top-[72px] bg-[#0f0f0f] z-10">
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            placeholder="Search YouTube" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#272727] text-white rounded-full py-2 pl-4 pr-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchVideos('technology'); // Reset to default
              }}
              className="absolute right-14 top-0 bottom-0 px-2 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            type="submit"
            className="absolute right-0 top-0 bottom-0 px-4 bg-[#222222] rounded-r-full border-l border-[#303030] hover:bg-[#303030] transition-colors flex items-center justify-center"
          >
            <Search className="w-5 h-5 text-gray-400" />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {error && !videos.length && (
          <div className="p-6 flex flex-col items-center text-center text-gray-400 mt-10">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {videos.map((video) => (
              <div 
                key={video.id.videoId} 
                className="cursor-pointer group"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-[#272727]">
                  <img 
                    src={video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url} 
                    alt={video.snippet.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" />
                  </div>
                </div>
                <div className="p-3 flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold">
                    {video.snippet.channelTitle.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-medium line-clamp-2 leading-tight mb-1" dangerouslySetInnerHTML={{ __html: video.snippet.title }} />
                    <span className="text-xs text-gray-400">{video.snippet.channelTitle}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(video.snippet.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {!isLoading && !error && videos.length === 0 && searchQuery && (
              <div className="text-center text-gray-500 mt-10">
                No results found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderPlayer = () => {
    if (!selectedVideo) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="flex flex-col h-full bg-[#0f0f0f] text-white z-20 absolute inset-0"
      >
        <div className="pt-12 pb-2 px-2 flex items-center bg-black">
          <button 
            onClick={() => setSelectedVideo(null)} 
            className="p-2 text-white rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="w-full aspect-video bg-black sticky top-[60px] z-30">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
            title={selectedVideo.snippet.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h1 className="text-xl font-bold mb-2" dangerouslySetInnerHTML={{ __html: selectedVideo.snippet.title }} />
          
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#272727]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {selectedVideo.snippet.channelTitle.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{selectedVideo.snippet.channelTitle}</span>
            </div>
            <button className="ml-auto bg-white text-black px-4 py-1.5 rounded-full font-medium text-sm">
              Subscribe
            </button>
          </div>

          <div className="bg-[#272727] rounded-xl p-3 text-sm">
            <p className="font-medium mb-2">
              Published on {new Date(selectedVideo.snippet.publishedAt).toLocaleDateString()}
            </p>
            <p className="whitespace-pre-wrap text-gray-300" dangerouslySetInnerHTML={{ __html: selectedVideo.snippet.description }} />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full w-full bg-[#0f0f0f] overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!selectedVideo && <motion.div key="list" className="h-full">{renderList()}</motion.div>}
        {selectedVideo && <motion.div key="player" className="h-full">{renderPlayer()}</motion.div>}
      </AnimatePresence>
    </div>
  );
}
