import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Play, Youtube, AlertCircle, Loader2, X, ThumbsUp, ThumbsDown, Share2, Download, Bookmark, MessageSquare, MoreVertical } from 'lucide-react';

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

const CATEGORIES = ['All', 'Music', 'Gaming', 'News', 'Live', 'Technology', 'Podcasts', 'Coding', 'React', 'AI'];

export default function YouTubeApp({ onBack }: YouTubeAppProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [comments, setComments] = useState<any[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [isLoadingExtra, setIsLoadingExtra] = useState(false);

  const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    if (selectedVideo && apiKey) {
      fetchExtraData(selectedVideo);
    }
  }, [selectedVideo]);

  const fetchExtraData = async (video: Video) => {
    setIsLoadingExtra(true);
    try {
      const commentsRes = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${video.id.videoId}&maxResults=15&key=${apiKey}`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.items || []);
      }
      const relatedRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(video.snippet.channelTitle)}&type=video&key=${apiKey}`);
      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        setRelatedVideos(relatedData.items?.filter((v: any) => v.id?.videoId && v.id.videoId !== video.id.videoId) || []);
      }
    } catch (err) {
      console.error("Failed to fetch extra data", err);
    } finally {
      setIsLoadingExtra(false);
    }
  };

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
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        if (info.offset.x > 50 || info.velocity.x > 500) {
          onBack();
        }
      }}
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
                setActiveCategory('All');
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

      <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 px-4 pb-3 sticky top-[124px] bg-[#0f0f0f] z-10">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setSearchQuery(cat === 'All' ? '' : cat);
              searchVideos(cat === 'All' ? 'technology' : cat);
            }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}
          >
            {cat}
          </button>
        ))}
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
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.2 }}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            setSelectedVideo(null);
          }
        }}
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

        <div id="player-scroll-container" className="flex-1 overflow-y-auto p-4">
          <h1 className="text-xl font-bold mb-2" dangerouslySetInnerHTML={{ __html: selectedVideo.snippet.title }} />
          
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#272727]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {selectedVideo.snippet.channelTitle.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{selectedVideo.snippet.channelTitle}</span>
              <span className="text-xs text-gray-400">1.2M subscribers</span>
            </div>
            <button className="ml-auto bg-white text-black px-4 py-1.5 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors">
              Subscribe
            </button>
          </div>

          <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 mb-4 pb-2">
            <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap">
              <ThumbsUp className="w-4 h-4" /> <span>Like</span>
              <div className="w-[1px] h-4 bg-white/20 mx-1" />
              <ThumbsDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap">
              <Share2 className="w-4 h-4" /> <span>Share</span>
            </button>
            <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap">
              <Download className="w-4 h-4" /> <span>Download</span>
            </button>
            <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap">
              <Bookmark className="w-4 h-4" /> <span>Save</span>
            </button>
          </div>

          <div className="bg-[#272727] rounded-xl p-3 text-sm mb-6">
            <p className="font-medium mb-2">
              Published on {new Date(selectedVideo.snippet.publishedAt).toLocaleDateString()}
            </p>
            <p className="whitespace-pre-wrap text-gray-300" dangerouslySetInnerHTML={{ __html: selectedVideo.snippet.description }} />
          </div>

          {/* Related Videos */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Related Videos</h3>
            {isLoadingExtra ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
            ) : (
              <div className="flex flex-col gap-3">
                {relatedVideos.map((video) => (
                  <div key={video.id.videoId} className="flex gap-3 cursor-pointer group" onClick={() => {
                    setSelectedVideo(video);
                    const playerContainer = document.getElementById('player-scroll-container');
                    if (playerContainer) playerContainer.scrollTop = 0;
                  }}>
                    <div className="relative w-40 aspect-video rounded-xl overflow-hidden bg-[#272727] flex-shrink-0">
                      <img src={video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.high?.url} alt={video.snippet.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex flex-col py-1">
                      <h4 className="text-sm font-medium line-clamp-2 leading-tight" dangerouslySetInnerHTML={{ __html: video.snippet.title }} />
                      <span className="text-xs text-gray-400 mt-1">{video.snippet.channelTitle}</span>
                      <span className="text-xs text-gray-400">{new Date(video.snippet.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t border-[#272727] pt-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Comments
            </h3>
            {isLoadingExtra ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
            ) : comments.length > 0 ? (
              <div className="flex flex-col gap-6">
                {comments.map((comment: any) => {
                  const snippet = comment.snippet.topLevelComment.snippet;
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <img src={snippet.authorProfileImageUrl} alt={snippet.authorDisplayName} className="w-10 h-10 rounded-full bg-[#272727]" />
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-300">@{snippet.authorDisplayName}</span>
                          <span className="text-xs text-gray-500">{new Date(snippet.publishedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm mt-1 text-gray-200" dangerouslySetInnerHTML={{ __html: snippet.textDisplay }} />
                        <div className="flex items-center gap-4 mt-2 text-gray-400">
                          <button className="flex items-center gap-1 hover:text-white transition-colors"><ThumbsUp className="w-3 h-3" /> <span className="text-xs">{snippet.likeCount > 0 ? snippet.likeCount : ''}</span></button>
                          <button className="hover:text-white transition-colors"><ThumbsDown className="w-3 h-3" /></button>
                          <button className="hover:text-white transition-colors"><MessageSquare className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <button className="text-gray-500 hover:text-white self-start"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No comments available.</p>
            )}
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
