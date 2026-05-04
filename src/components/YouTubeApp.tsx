import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Play, Youtube, AlertCircle, Loader2, X, ThumbsUp, ThumbsDown, Share2, Download, Bookmark, MessageSquare, MoreVertical, Cast, Bell, Home, Compass, PlaySquare, MonitorPlay, Mic, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import YouTube from 'react-youtube';

interface YouTubeAppProps {
  onBack: () => void;
}

interface YouTubeVideo {
  id: { videoId: string } | string;
  snippet: {
    title: string;
    description: string;
    channelId?: string;
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
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [comments, setComments] = useState<any[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingExtra, setIsLoadingExtra] = useState(false);
  
  // Custom Player State
  const [playerInfo, setPlayerInfo] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchTrending();
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedVideo) {
      fetchExtraData(selectedVideo);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setPlayerInfo(null);
      setIsPlaying(false);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
  }, [selectedVideo]);

  const onPlayerReady = (event: any) => {
    setPlayerInfo(event.target);
    setDuration(event.target.getDuration());
    event.target.setVolume(volume);
    setIsPlaying(true);
  };

  const onPlayerStateChange = (event: any) => {
    setIsPlaying(event.data === 1); // 1 is playing state in YT API
    if (event.data === 1) {
      if (!progressIntervalRef.current) {
        progressIntervalRef.current = setInterval(() => {
          setProgress(event.target.getCurrentTime());
        }, 1000);
      }
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  const togglePlay = () => {
    if (playerInfo) {
      if (isPlaying) {
        playerInfo.pauseVideo();
      } else {
        playerInfo.playVideo();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setProgress(time);
    if (playerInfo) {
      playerInfo.seekTo(time, true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    if (vol > 0) setIsMuted(false);
    if (playerInfo) {
      playerInfo.setVolume(vol);
      if (vol > 0) playerInfo.unMute();
      else {
        playerInfo.mute();
        setIsMuted(true);
      }
    }
  };

  const toggleMute = () => {
    if (playerInfo) {
      if (isMuted) {
        playerInfo.unMute();
        playerInfo.setVolume(volume || 50);
        setVolume(volume || 50);
      } else {
        playerInfo.mute();
        setVolume(0);
      }
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const mapInvidiousToYouTubeVideo = (item: any): YouTubeVideo => ({
    id: { videoId: item.videoId },
    snippet: {
      title: item.title,
      description: item.description || '',
      channelId: item.authorId || item.authorId,
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
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=20&key=${apiKey}`);
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
    if (!query.trim()) {
      fetchTrending();
      return;
    }
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
      const channelId = selectedVideo.snippet.channelId ? `&channelId=${selectedVideo.snippet.channelId}` : `&q=${encodeURIComponent(selectedVideo.snippet.channelTitle)}`;
      const [relatedRes, commentsRes] = await Promise.all([
        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10${channelId}&type=video&key=${apiKey}`).catch(() => null),
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
    if (!searchQuery.trim()) {
      fetchTrending();
    } else {
      searchVideos(searchQuery);
    }
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
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 pt-safe-island bg-[#0f0f0f] sticky top-0 z-20">
        <div className="flex items-center gap-1 cursor-pointer shrink-0" onClick={onBack}>
          <ChevronLeft className="w-6 h-6 text-white" />
          <Youtube className="w-8 h-8 text-red-600 hidden sm:block" />
        </div>
        <div className="flex-1 flex justify-center max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="flex flex-1 relative items-center">
            <div className="flex w-full overflow-hidden rounded-full border border-white/20 bg-transparent focus-within:border-blue-500">
              <div className="hidden sm:flex items-center pl-4 text-white/50 bg-[#121212]">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121212] sm:bg-[#121212] text-white py-2 pl-4 sm:pl-2 pr-10 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-[4.5rem] sm:right-[5.5rem] top-0 bottom-0 flex items-center justify-center text-gray-400 hover:text-white z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-4 sm:px-6 bg-white/10 text-white/70 hover:text-white border-l border-white/20 flex items-center justify-center transition-colors"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <button type="button" className="p-2 ml-2 bg-white/10 text-white rounded-full shrink-0 hover:bg-white/20">
              <Mic className="w-5 h-5" />
            </button>
          </form>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-white shrink-0 ml-2">
          <Cast className="w-5 h-5" />
          <Bell className="w-5 h-5" />
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">R</div>
        </div>
      </div>

      {/* Categories */}
      {(
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-3 px-4 py-2 bg-[#0f0f0f] z-10 border-b border-white/10 shrink-0">
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
        <div 
          className="w-full aspect-video bg-black sticky top-0 z-40 relative group shrink-0"
          onMouseMove={handleMouseMove}
          onClick={handleMouseMove}
          onTouchStart={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          <div className="w-full h-full pointer-events-none">
            <YouTube 
              videoId={videoId} 
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  disablekb: 1,
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  iv_load_policy: 3,
                  fs: 0,
                  playsinline: 1
                }
              }}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              className="w-full h-full pointer-events-auto"
              iframeClassName="w-full h-full"
            />
          </div>

          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 flex flex-col justify-between pointer-events-none z-10"
              >
                {/* Top bar with back button */}
                <div className="p-4 pt-safe-island flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
                  <button 
                    onClick={() => setSelectedVideo(null)} 
                    className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                </div>

                {/* Center play/pause */}
                <div className="flex-1 flex items-center justify-center pointer-events-auto">
                  <button 
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-black/50 hover:bg-red-600/90 text-white flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-105"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 ml-1 fill-current" />}
                  </button>
                </div>

                {/* Bottom controls */}
                <div className="p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-auto flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={togglePlay} className="text-white hover:text-red-500 transition-colors">
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                      </button>
                      
                      <div className="flex items-center gap-2 group/volume">
                        <button onClick={toggleMute} className="text-white hover:text-red-500 transition-colors">
                          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs font-mono ml-2 opacity-80">
                        <span>{formatTime(progress)}</span>
                        <span>/</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                    
                    <button className="text-white hover:text-red-500 transition-colors">
                      <Maximize className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="w-full flex items-center h-4 group/seek relative mt-1">
                    {/* Scrub bar track visual */}
                    <div className="absolute left-0 right-0 h-1 group-hover/seek:h-1.5 transition-all bg-white/30 rounded-full overflow-hidden pointer-events-none">
                      {/* Played portion */}
                      <div 
                        className="absolute top-0 left-0 bottom-0 bg-red-600 transition-all duration-100"
                        style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                      />
                    </div>
                    {/* Invisible range input for interaction */}
                    <input 
                      type="range" 
                      min="0" 
                      max={duration || 100} 
                      value={progress}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 m-0 p-0"
                    />
                    {/* Scrub handle visual (CSS thumb) */}
                    <div 
                      className="absolute w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none top-1/2 -translate-y-1/2 -ml-1.5"
                      style={{ left: `${(progress / (duration || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
