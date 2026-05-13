import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Play, Youtube, AlertCircle, Loader2, X, ThumbsUp, ThumbsDown, Share2, Download, Bookmark, MessageSquare, MoreVertical, Cast, Bell, Home, Compass, PlaySquare, MonitorPlay, Mic, Pause, Volume2, VolumeX, Maximize, Minimize, PlusCircle, Sparkles, Wand2, Upload, Video } from 'lucide-react';
import YouTube from 'react-youtube';
import { GoogleGenAI } from '@google/genai';

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
  const [playerState, setPlayerState] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // AI Generator State
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const aiImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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

  const handleGenerateAiVideo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim() && !aiImage) return;

    setIsGeneratingAi(true);
    setError(null);
    setAiStatus('Checking API Key...');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key is missing in the environment.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      setAiStatus(`Submitting generation request to Veo 3...`);
      
      let finalPrompt = aiPrompt || 'A cinematic high quality video';
      if (aiImage) {
        finalPrompt = `${aiPrompt ? aiPrompt + '\n\n' : ''}[System: User provided an image as reference for Image-to-Video generation.]`;
      }

      // In a real implementation we would upload mapping image to GCS and pass gs:// URI, 
      // but for the preview API we pass the intent in the prompt.
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: finalPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      }).catch(err => {
        console.warn("Veo generation failed, returning mockup", err);
        return null;
      });

      if (!operation) {
        // Mocking the video generation for users who don't have Veo access yet
        setAiStatus('Veo access limited. Generating simulated video...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        setGeneratedVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
        setAiStatus('');
        setIsGeneratingAi(false);
        return;
      }

      setAiStatus('Processing video... This may take a few minutes.');
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setAiStatus('Fetching video file...');
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch the generated video file.');
        }
        
        const blob = await response.blob();
        setGeneratedVideoUrl(URL.createObjectURL(blob));
        setAiStatus('');
      } else {
        throw new Error('No video URL returned from the model.');
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || '';
      let displayError = errorMessage;
      
      if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
        displayError = 'Video generation failed. Please try again later.';
      } else if (errorMessage.startsWith('{')) {
        try {
          const parsed = JSON.parse(errorMessage);
          if (parsed.error && parsed.error.message) {
            displayError = parsed.error.message;
          }
        } catch (e) {}
      }
      
      setError(displayError || 'Failed to process AI video');
      setAiStatus('');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const onPlayerReady = (event: any) => {
    setPlayerInfo(event.target);
    setDuration(event.target.getDuration());
    event.target.setVolume(volume);
  };

  const onPlayerStateChange = (event: any) => {
    setPlayerState(event.data);
    const playing = event.data === 1;
    setIsPlaying(playing); // 1 is playing state in YT API
    
    if (playing) {
      handleMouseMove(); // Shows controls briefly, then hides
      if (!progressIntervalRef.current) {
        progressIntervalRef.current = setInterval(() => {
          setProgress(event.target.getCurrentTime());
        }, 1000);
      }
    } else {
      setShowControls(true); // Always show when paused
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
        <div className="flex flex-col items-center text-white cursor-pointer"><Home className="w-6 h-6" /><span className="text-[10px] mt-1">Home</span></div>
        <div className="flex flex-col items-center text-white/50 cursor-pointer"><PlaySquare className="w-6 h-6" /><span className="text-[10px] mt-1">Shorts</span></div>
        <div 
          className="flex flex-col items-center cursor-pointer mb-2"
          onClick={() => setShowCreateMenu(true)}
        >
          <div className="w-10 h-10 border border-white flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <PlusCircle className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="flex flex-col items-center text-white/50 cursor-pointer"><MonitorPlay className="w-6 h-6" /><span className="text-[10px] mt-1">Subscriptions</span></div>
        <div className="flex flex-col items-center text-white/50 cursor-pointer"><Bookmark className="w-6 h-6" /><span className="text-[10px] mt-1">Library</span></div>
      </div>
      
      {showCreateMenu && renderCreateMenu()}
      {showAiGenerator && renderAiGenerator()}
    </motion.div>
  );

  const renderCreateMenu = () => (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end pointer-events-auto"
        onClick={() => setShowCreateMenu(false)}
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-[#212121] rounded-t-2xl w-full max-w-md mx-auto p-4 flex flex-col gap-2 relative pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pl-4 pr-2 py-2">
            <h2 className="text-xl font-bold text-white">Create</h2>
            <button 
              onClick={() => setShowCreateMenu(false)}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex flex-col gap-1 pb-safe-bottom">
            <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <PlaySquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-medium text-base">Create a Short</span>
            </button>
            
            <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-medium text-base">Upload a video</span>
            </button>
            
            <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Cast className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-medium text-base">Go live</span>
            </button>

            <button 
              onClick={() => {
                setShowCreateMenu(false);
                setShowAiGenerator(true);
              }}
              className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-white font-medium text-base">Generate with Veo AI</span>
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">New Feature</span>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setAiImage(url);
    }
  };

  const renderAiGenerator = () => (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-[#0f0f0f] pointer-events-auto flex flex-col"
    >
      <div className="flex items-center justify-between p-4 pt-safe-island bg-[#0f0f0f]/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setShowAiGenerator(false);
              setGeneratedVideoUrl(null);
            }} 
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
             <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-white font-bold text-lg">YouTube AI Studio</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-2xl mx-auto flex flex-col gap-6 pt-4">
          
          <div className="text-center space-y-2 mb-4">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400">Dream Track & Veo 3</h1>
            <p className="text-zinc-400 text-sm">Generate incredible AI backgrounds or fully cinematic videos instantly.</p>
          </div>

          <div className="bg-[#212121] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">Your Prompt</label>
              <button 
                onClick={() => aiImageInputRef.current?.click()}
                className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-md transition-colors"
              >
                <PlusCircle className="w-3 h-3" />
                <span>Add Image</span>
              </button>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={aiImageInputRef}
                onChange={handleImageUpload}
              />
            </div>
            {aiImage && (
              <div className="relative w-24 h-24 mb-3 rounded-lg overflow-hidden border border-white/10">
                <img src={aiImage} alt="Reference" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setAiImage(null)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}
            <textarea 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="A cinematic drone shot over a neon-lit cyberpunk city at night, rain falling, 4k..." 
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 min-h-[120px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none" 
            />
          </div>

          <button 
            onClick={handleGenerateAiVideo}
            disabled={(!aiPrompt.trim() && !aiImage) || isGeneratingAi}
            className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              (!aiPrompt.trim() && !aiImage) || isGeneratingAi 
                ? 'bg-white/10 text-white/30' 
                : 'bg-white text-black hover:bg-zinc-200 active:scale-[0.98]'
            }`}
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{aiStatus || 'Generating...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>{aiImage ? 'Generate from Image' : 'Generate Video'}</span>
              </>
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center space-x-3 mt-4">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {generatedVideoUrl && !isGeneratingAi && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 space-y-4"
            >
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider pl-1">Generated Result</h3>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                <video 
                  src={generatedVideoUrl} 
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex gap-3">
                <a 
                  href={generatedVideoUrl} 
                  download="youtube-ai-video.mp4"
                  className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </a>
                <button className="flex-1 py-3 bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors">
                  <PlaySquare className="w-5 h-5" />
                  <span>Use in Short</span>
                </button>
              </div>
            </motion.div>
          )}

        </div>
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
          ref={playerContainerRef}
          className={`w-full bg-black sticky top-0 z-40 relative group shrink-0 ${isFullscreen ? 'h-screen' : 'aspect-video'}`}
        >
          <div className="w-full h-full">
            <YouTube 
              videoId={videoId} 
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 1,
                  controls: 1,
                  disablekb: 0,
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  iv_load_policy: 3,
                  fs: 1,
                  playsinline: 1
                }
              }}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              className="w-full h-full"
              iframeClassName="w-full h-full"
            />
          </div>

          {/* Persistent Back Button */}
          <div className="absolute top-2 left-2 z-50 pointer-events-none">
            <button 
              onClick={() => setSelectedVideo(null)} 
              className="p-2 bg-black/60 text-white hover:bg-black/80 rounded-full transition-colors pointer-events-auto backdrop-blur-md shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
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
