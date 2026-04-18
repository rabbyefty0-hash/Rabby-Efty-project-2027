import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Play, Youtube, AlertCircle, Loader2, X, ThumbsUp, ThumbsDown, Share2, Download, Bookmark, MessageSquare, MoreVertical, Cast, Bell, Home, Compass, PlaySquare, MonitorPlay, Mic } from 'lucide-react';

interface YouTubeAppProps {
  onBack: () => void;
}

interface YouTubeVideo {
  id: { videoId: string } | string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

const CATEGORIES = ['All', 'Music', 'Gaming', 'News', 'Live', 'Technology', 'Podcasts', 'Coding', 'React', 'AI'];

// Fallback mock data when API key is missing or quota exceeded
const MOCK_VIDEOS: YouTubeVideo[] = [
  {
    id: { videoId: 'dQw4w9WgXcQ' },
    snippet: {
      title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
      description: 'The official video for “Never Gonna Give You Up” by Rick Astley',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' }
      },
      channelTitle: 'Rick Astley',
      publishedAt: '2009-10-25T06:57:33Z'
    }
  },
  {
    id: { videoId: 'jNQXAC9IVRw' },
    snippet: {
      title: 'Me at the zoo',
      description: 'The first video ever uploaded to YouTube.',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg' }
      },
      channelTitle: 'jawed',
      publishedAt: '2005-04-24T03:31:52Z'
    }
  },
  {
    id: { videoId: '9bZkp7q19f0' },
    snippet: {
      title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
      description: 'PSY - GANGNAM STYLE(강남스타일) M/V',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg' }
      },
      channelTitle: 'officialpsy',
      publishedAt: '2012-07-15T07:46:32Z'
    }
  }
];

export default function YouTubeApp({ onBack }: YouTubeAppProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [comments, setComments] = useState<any[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingExtra, setIsLoadingExtra] = useState(false);

  const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    if (selectedVideo) {
      fetchExtraData(selectedVideo);
    }
  }, [selectedVideo]);

  const mapInvidiousToYouTubeVideo = (item: any): YouTubeVideo => ({
    id: { videoId: item.videoId },
    snippet: {
      title: item.title,
      description: item.description || '',
      thumbnails: {
        medium: { url: item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url || item.videoThumbnails?.[0]?.url || '' },
        high: { url: item.videoThumbnails?.find((t: any) => t.quality === 'high')?.url || item.videoThumbnails?.[0]?.url || '' }
      },
      channelTitle: item.author,
      publishedAt: item.publishedText || ''
    }
  });

  const INVIDIOUS_INSTANCES = [
    'https://inv.thepixora.com',
    'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com',
    'https://inv.nadeko.net'
  ];

  const fetchWithFallback = async (endpoint: string) => {
    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        const res = await fetch(`${instance}${endpoint}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn(`Failed to fetch from ${instance}`);
      }
    }
    throw new Error('All Invidious instances failed');
  };

  const fetchTrending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!apiKey) {
        const data = await fetchWithFallback('/api/v1/trending');
        setVideos(data.filter((item: any) => item.type === 'video' || item.videoId).map(mapInvidiousToYouTubeVideo));
        setIsLoading(false);
        return;
      }
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=trending&type=video&key=${apiKey}`);
      if (!res.ok) throw new Error('Failed to fetch trending videos');
      const data = await res.json();
      setVideos(data.items || MOCK_VIDEOS);
    } catch (err: any) {
      console.warn('API failed, using fallback data', err);
      try {
        const data = await fetchWithFallback('/api/v1/trending');
        setVideos(data.filter((item: any) => item.type === 'video' || item.videoId).map(mapInvidiousToYouTubeVideo));
      } catch (fallbackErr) {
        setVideos(MOCK_VIDEOS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const searchVideos = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      if (!apiKey) {
        const data = await fetchWithFallback(`/api/v1/search?q=${encodeURIComponent(query)}`);
        setVideos(data.filter((item: any) => item.type === 'video' || item.videoId).map(mapInvidiousToYouTubeVideo));
        setIsLoading(false);
        return;
      }
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`);
      if (!res.ok) throw new Error('Failed to search videos');
      const data = await res.json();
      setVideos(data.items || MOCK_VIDEOS);
    } catch (err: any) {
      console.warn('API failed, using fallback data', err);
      try {
        const data = await fetchWithFallback(`/api/v1/search?q=${encodeURIComponent(query)}`);
        setVideos(data.filter((item: any) => item.type === 'video' || item.videoId).map(mapInvidiousToYouTubeVideo));
      } catch (fallbackErr) {
        setVideos(MOCK_VIDEOS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExtraData = async (video: YouTubeVideo) => {
    setIsLoadingExtra(true);
    const videoId = typeof video.id === 'string' ? video.id : video.id.videoId;
    try {
      if (!apiKey) {
        try {
          const data = await fetchWithFallback(`/api/v1/videos/${videoId}`);
          if (data.recommendedVideos) {
            setRelatedVideos(data.recommendedVideos.map(mapInvidiousToYouTubeVideo));
          } else {
            setRelatedVideos(MOCK_VIDEOS);
          }
          
          const commentsData = await fetchWithFallback(`/api/v1/comments/${videoId}`);
          setComments(commentsData.comments?.map((c: any) => ({
            snippet: {
              topLevelComment: {
                snippet: {
                  authorDisplayName: c.author,
                  authorProfileImageUrl: c.authorThumbnails?.[0]?.url,
                  textDisplay: c.contentHtml || c.content,
                  likeCount: c.likeCount,
                  publishedAt: c.publishedText
                }
              }
            }
          })) || []);
        } catch (e) {
          setRelatedVideos(MOCK_VIDEOS);
          setComments([]);
        }
        setIsLoadingExtra(false);
        return;
      }
      const [relatedRes, commentsRes] = await Promise.all([
        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&relatedToVideoId=${videoId}&type=video&key=${apiKey}`).catch(() => null),
        fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=10&key=${apiKey}`).catch(() => null)
      ]);

      if (relatedRes && relatedRes.ok) {
        const data = await relatedRes.json();
        setRelatedVideos(data.items || MOCK_VIDEOS);
      } else {
        setRelatedVideos(MOCK_VIDEOS);
      }
      if (commentsRes && commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch extra data", err);
      try {
        const data = await fetchWithFallback(`/api/v1/videos/${videoId}`);
        if (data.recommendedVideos) {
          setRelatedVideos(data.recommendedVideos.map(mapInvidiousToYouTubeVideo));
        }
      } catch (e) {}
    } finally {
      setIsLoadingExtra(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchVideos(searchQuery);
    setIsSearchMode(false);
  };

  const getVideoId = (video: YouTubeVideo) => {
    return typeof video.id === 'string' ? video.id : video.id.videoId;
  };

  const renderList = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-[#0f0f0f] text-white"
    >
      {/* Top Bar */}
      {!isSearchMode ? (
        <div className="flex items-center justify-between px-4 py-3 bg-[#0f0f0f] sticky top-0 z-20">
          <div className="flex items-center gap-1 cursor-pointer" onClick={onBack}>
            <ChevronLeft className="w-6 h-6 mr-1" />
            <Youtube className="w-8 h-8 text-red-600" />
            <span className="text-xl font-bold tracking-tighter text-white">YouTube</span>
          </div>
          <div className="flex items-center gap-5 text-white">
            <Cast className="w-5 h-5" />
            <Bell className="w-5 h-5" />
            <Search className="w-5 h-5 cursor-pointer" onClick={() => setIsSearchMode(true)} />
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">R</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#0f0f0f] sticky top-0 z-20">
          <button onClick={() => setIsSearchMode(false)} className="p-2 -ml-2 text-white rounded-full hover:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <form onSubmit={handleSearch} className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search YouTube" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#272727] text-white rounded-full py-2 pl-4 pr-10 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-0 bottom-0 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
          <button className="p-2 bg-[#272727] rounded-full">
            <Mic className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Categories */}
      {!isSearchMode && (
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-3 px-4 py-2 sticky top-[60px] bg-[#0f0f0f] z-10 border-b border-white/10">
          <button className="p-1.5 bg-[#272727] rounded-md shrink-0"><Compass className="w-5 h-5" /></button>
          <div className="w-[1px] h-6 bg-white/20 self-center mx-1 shrink-0" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                if (cat === 'All') fetchTrending();
                else searchVideos(cat);
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Video List */}
      <div className="flex-1 overflow-y-auto pb-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : error ? (
          <div className="p-6 flex flex-col items-center text-center text-gray-400 mt-10">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p>{error}</p>
            <button onClick={fetchTrending} className="mt-4 px-4 py-2 bg-white/10 rounded-full text-white">Retry</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-0 sm:p-4">
            {videos.map((video, idx) => (
              <div 
                key={idx} 
                className="cursor-pointer group flex flex-col sm:rounded-xl overflow-hidden bg-[#0f0f0f] sm:bg-[#181818]"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-[#272727]">
                  <img 
                    src={video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url} 
                    alt={video.snippet.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                    {video.snippet.channelTitle.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col pr-6 relative w-full">
                    <h3 className="text-sm font-medium line-clamp-2 leading-tight mb-1 text-white" dangerouslySetInnerHTML={{ __html: video.snippet.title }} />
                    <div className="text-xs text-gray-400 flex items-center flex-wrap gap-1">
                      <span>{video.snippet.channelTitle}</span>
                      <span className="text-[10px]">•</span>
                      <span>{video.snippet.publishedAt.includes('T') ? new Date(video.snippet.publishedAt).toLocaleDateString() : video.snippet.publishedAt}</span>
                    </div>
                    <MoreVertical className="w-4 h-4 text-white/50 absolute right-0 top-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="flex items-center justify-between px-6 py-2 bg-[#0f0f0f] border-t border-white/10 sticky bottom-0 z-20 pb-safe">
        <div className="flex flex-col items-center text-white"><Home className="w-6 h-6" /><span className="text-[10px] mt-1">Home</span></div>
        <div className="flex flex-col items-center text-white/50"><PlaySquare className="w-6 h-6" /><span className="text-[10px] mt-1">Shorts</span></div>
        <div className="flex flex-col items-center text-white/50"><MonitorPlay className="w-6 h-6" /><span className="text-[10px] mt-1">Subscriptions</span></div>
        <div className="flex flex-col items-center text-white/50"><Bookmark className="w-6 h-6" /><span className="text-[10px] mt-1">Library</span></div>
      </div>
    </motion.div>
  );

  const renderPlayer = () => {
    if (!selectedVideo) return null;
    const videoId = getVideoId(selectedVideo);
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="flex flex-col h-full bg-[#0f0f0f] text-white z-30 absolute inset-0"
      >
        <div className="w-full aspect-video bg-black sticky top-0 z-40 relative group shrink-0">
          <button 
            onClick={() => setSelectedVideo(null)} 
            className="absolute top-4 left-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`}
            title={selectedVideo.snippet.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>

        <div id="player-scroll-container" className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h1 className="text-lg font-bold mb-2 leading-tight" dangerouslySetInnerHTML={{ __html: selectedVideo.snippet.title }} />
            <div className="flex items-center text-xs text-gray-400 mb-4">
              <span>{selectedVideo.snippet.publishedAt.includes('T') ? new Date(selectedVideo.snippet.publishedAt).toLocaleDateString() : selectedVideo.snippet.publishedAt}</span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                  {selectedVideo.snippet.channelTitle.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{selectedVideo.snippet.channelTitle}</span>
                  <span className="text-xs text-gray-400">1.2M subscribers</span>
                </div>
              </div>
              <button className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">
                Subscribe
              </button>
            </div>

            <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 mb-6 pb-2">
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

            {/* Comments Preview */}
            <div className="bg-[#272727] rounded-xl p-3 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">Comments</span>
              </div>
              {isLoadingExtra ? (
                <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-gray-500" /></div>
              ) : comments.length > 0 ? (
                <div className="flex gap-2 items-start">
                  <img src={comments[0].snippet.topLevelComment.snippet.authorProfileImageUrl} className="w-6 h-6 rounded-full shrink-0" />
                  <p className="text-xs text-gray-200 line-clamp-2 flex-1" dangerouslySetInnerHTML={{ __html: comments[0].snippet.topLevelComment.snippet.textDisplay }} />
                </div>
              ) : (
                <p className="text-xs text-gray-400">No comments available.</p>
              )}
            </div>

            {/* Related Videos */}
            <div className="flex flex-col gap-3">
              {isLoadingExtra ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
              ) : (
                relatedVideos.map((video, idx) => (
                  <div key={idx} className="flex gap-2 cursor-pointer group" onClick={() => {
                    setSelectedVideo(video);
                    const playerContainer = document.getElementById('player-scroll-container');
                    if (playerContainer) playerContainer.scrollTop = 0;
                  }}>
                    <div className="relative w-40 aspect-video rounded-xl overflow-hidden bg-[#272727] flex-shrink-0">
                      <img src={video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.high?.url} alt={video.snippet.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex flex-col py-0.5 pr-2">
                      <h4 className="text-sm font-medium line-clamp-2 leading-tight text-white" dangerouslySetInnerHTML={{ __html: video.snippet.title }} />
                      <span className="text-xs text-gray-400 mt-1">{video.snippet.channelTitle}</span>
                      <div className="text-xs text-gray-400 flex items-center flex-wrap gap-1">
                        <span>{video.snippet.publishedAt.includes('T') ? new Date(video.snippet.publishedAt).toLocaleDateString() : video.snippet.publishedAt}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
