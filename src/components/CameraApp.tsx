import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, FlipHorizontal, Circle, Square, X, Sparkles, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';

interface CameraAppProps {
  onClose: () => void;
}

export default function CameraApp({ onClose }: CameraAppProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isChatOpen]);

  const handleSendMessage = async (overrideText?: string) => {
    const userMessage = overrideText || input;
    if (!userMessage.trim() || isTyping) return;
    
    if (!overrideText) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API key is missing.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const parts: any[] = [{ text: userMessage }];
      
      // Capture current frame or use captured image
      if (capturedImage) {
        const base64 = capturedImage.split(',')[1];
        parts.push({
          inlineData: {
            data: base64,
            mimeType: 'image/jpeg'
          }
        });
      } else if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (facingMode === 'user') {
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
            parts.push({
              inlineData: {
                data: base64,
                mimeType: 'image/jpeg'
              }
            });
          }
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: { parts }
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please check your API key and try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setError(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: mode === 'video'
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Permission denied. Please allow camera and microphone access in your browser settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera found on this device.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError("Camera is already in use by another application.");
      } else {
        setError(`Could not access camera: ${err.message || err.name || 'Unknown error'}`);
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, mode]);

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const startRecording = () => {
    if (stream) {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        // In a real app, you'd save this or show a preview
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCapture = () => {
    if (mode === 'photo') {
      takePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  if (capturedImage) {
    return (
      <div className="flex flex-col h-full bg-black relative">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={() => setCapturedImage(null)} className="p-2 rounded-full bg-black/50 text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setIsChatOpen(true);
                if (messages.length === 0) {
                  handleSendMessage("Analyze this image and provide context-aware help, suggestions, or identify what it is.");
                }
              }} 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white backdrop-blur-md font-medium text-sm shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Analyze
            </button>
            <button onClick={() => {
              const a = document.createElement('a');
              a.href = capturedImage;
              a.download = `photo-${Date.now()}.jpg`;
              a.click();
            }} className="px-4 py-2 bg-white text-black rounded-full font-medium text-sm">
              Save
            </button>
          </div>
        </div>
        <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />

        {/* Chat Overlay for Captured Image */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex flex-col"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.1 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsChatOpen(false);
                }
              }}
            >
              <div className="p-4 pt-12 flex justify-between items-center bg-black/40 border-b border-white/10">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Image Assistant
                </h3>
                <button onClick={() => setIsChatOpen(false)} className="p-2 rounded-full bg-white/10 text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-white/50 space-y-4">
                    <Sparkles className="w-12 h-12 opacity-50" />
                    <p className="text-center">Ask me anything about this photo!</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-zinc-800 text-white rounded-tl-sm border border-white/10'
                    }`}>
                      {msg.role === 'model' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 rounded-2xl rounded-tl-sm p-4 border border-white/10">
                      <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-black/40 border-t border-white/10 pb-safe">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about this photo..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isTyping}
                    className="p-3 rounded-full bg-blue-600 text-white disabled:opacity-50 disabled:bg-white/10 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-full bg-black relative"
      style={{ touchAction: 'pan-y' }}
    >
      <div 
        className="absolute inset-y-0 left-0 w-4 z-50"
        onPointerDown={(e) => {
          const startX = e.clientX;
          const handlePointerUp = (upEvent: PointerEvent) => {
            if (upEvent.clientX - startX > 50) {
              onClose();
            }
            window.removeEventListener('pointerup', handlePointerUp);
          };
          window.addEventListener('pointerup', handlePointerUp);
        }}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onClose} className="p-2 rounded-full bg-black/50 text-white backdrop-blur-md">
          <X className="w-5 h-5" />
        </button>
        <div className="flex space-x-4 bg-black/50 backdrop-blur-md rounded-full p-1">
          <button 
            onClick={() => setMode('photo')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === 'photo' ? 'bg-white text-black' : 'text-white'}`}
          >
            PHOTO
          </button>
          <button 
            onClick={() => setMode('video')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === 'video' ? 'bg-white text-black' : 'text-white'}`}
          >
            VIDEO
          </button>
        </div>
        <button onClick={() => {
          setIsChatOpen(true);
          if (messages.length === 0) {
            handleSendMessage("Analyze what the camera is currently seeing and provide context-aware help or suggestions.");
          }
        }} className="p-2 rounded-full bg-black/50 text-white backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {error ? (
          <div className="p-6 text-center">
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-2xl backdrop-blur-md">
              <p className="font-medium mb-2">Camera Error</p>
              <p className="text-sm opacity-80">{error}</p>
              <button 
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        )}
        {isRecording && (
          <div className="absolute top-6 right-6 flex items-center space-x-2 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/50 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-500 tracking-widest">REC</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between px-10 pb-6">
        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
          {/* Gallery thumbnail placeholder */}
        </div>
        
        <button 
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1"
        >
          <div className={`w-full h-full rounded-full transition-all duration-300 ${
            mode === 'photo' ? 'bg-white' : isRecording ? 'bg-red-500 rounded-lg scale-50' : 'bg-red-500'
          }`} />
        </button>
        
        <button 
          onClick={toggleFacingMode}
          className="w-12 h-12 rounded-full bg-zinc-800/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
        >
          <FlipHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex flex-col"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.1 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setIsChatOpen(false);
              }
            }}
          >
            <div className="p-4 pt-12 flex justify-between items-center bg-black/40 border-b border-white/10">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Camera Assistant
              </h3>
              <button onClick={() => setIsChatOpen(false)} className="p-2 rounded-full bg-white/10 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-white/50 space-y-4">
                  <Sparkles className="w-12 h-12 opacity-50" />
                  <p className="text-center">Ask me anything about what the camera sees!</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-zinc-800 text-white rounded-tl-sm border border-white/10'
                  }`}>
                    {msg.role === 'model' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 rounded-2xl rounded-tl-sm p-4 border border-white/10">
                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-black/40 border-t border-white/10 pb-safe">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about what you see..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="p-3 rounded-full bg-blue-600 text-white disabled:opacity-50 disabled:bg-white/10 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
