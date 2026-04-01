import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, FlipHorizontal, Circle, Square, X } from 'lucide-react';

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: mode === 'video'
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
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
          <button onClick={() => {
            const a = document.createElement('a');
            a.href = capturedImage;
            a.download = `photo-${Date.now()}.jpg`;
            a.click();
          }} className="px-4 py-2 bg-white text-black rounded-full font-medium text-sm">
            Save
          </button>
        </div>
        <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
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
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
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
    </div>
  );
}
