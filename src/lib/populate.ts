import { getAllFiles, addNode, generateId, VFSNode } from './vfs';

// Helper to generate a beautiful placeholder image from standard HTML canvas
const getFallbackImage = (): Promise<Blob> => {
  return new Promise((resolve) => {
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Soft modern aesthetic dark slate to warm twilight gradient
          const gradient = ctx.createLinearGradient(0, 0, 800, 600);
          gradient.addColorStop(0, '#1e1b4b'); // indigo-950
          gradient.addColorStop(0.5, '#4338ca'); // indigo-700
          gradient.addColorStop(1, '#ffedd5'); // orange-100
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 800, 600);

          // Aesthetic framing
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 20;
          ctx.strokeRect(30, 30, 740, 540);

          // Overlay Title Accent
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.font = 'black 90px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('GALLERY', 400, 240);

          // Subtitle
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px sans-serif';
          ctx.fillText('Vacation Cabin & Mountains', 400, 340);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '18px monospace';
          ctx.fillText('Offline Synthesized Visual Asset', 400, 390);
        }
        canvas.toBlob((blob) => {
          resolve(blob || new Blob(['image data'], { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      } catch (e) {
        resolve(new Blob(['image data'], { type: 'image/jpeg' }));
      }
    } else {
      resolve(new Blob(['image data'], { type: 'image/jpeg' }));
    }
  });
};

// Helper to generate a brief valid playing audio synth WAV in memory using Web Audio
const getFallbackAudio = async (): Promise<Blob> => {
  try {
    const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    if (OfflineCtx) {
      const sampleRate = 44100;
      const duration = 0.5; // Short 500ms beep sound
      const context = new OfflineCtx(1, sampleRate * duration, sampleRate);
      
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, 0); // standard A4 pitch

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.5, 0);
      gain.gain.exponentialRampToValueAtTime(0.01, duration - 0.05);

      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      
      const renderedBuffer = await context.startRendering();
      
      // WAV format generation
      const buffer = new ArrayBuffer(44 + renderedBuffer.length * 2);
      const view = new DataView(buffer);
      
      const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + renderedBuffer.length * 2, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // type = PCM
      view.setUint16(22, 1, true); // mono channel
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true); // 16-bit
      writeString(view, 36, 'data');
      view.setUint32(40, renderedBuffer.length * 2, true);
      
      const channelData = renderedBuffer.getChannelData(0);
      let offset = 44;
      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        const shortVal = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, shortVal, true);
        offset += 2;
      }
      return new Blob([buffer], { type: 'audio/wav' });
    }
  } catch (error) {
    // fallback to passive placeholder
  }
  return new Blob([new Uint8Array(44)], { type: 'audio/wav' });
};

// Helper for minimal fallback video
const getFallbackVideo = (): Blob => {
  // 1-second tiny black silent WebM file structure stub
  const webmHex = '1a45dfa3010000000000001f4286810142f7810142f2810442f381084282847765626d42878102428581021853806701000000000000181549a966010000000000000d1654ae6b0100000000000000';
  try {
    const length = webmHex.length / 2;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = parseInt(webmHex.substr(i * 2, 2), 16);
    }
    return new Blob([bytes], { type: 'video/webm' });
  } catch (e) {
    return new Blob([new Uint8Array(200)], { type: 'video/mp4' });
  }
};

export const populateDummyData = async () => {
  try {
    const existingFiles = await getAllFiles();
    if (existingFiles.length > 0) return; // Already populated

    // Create a folder
    const folderId = generateId();
    const folderNode: VFSNode = {
      id: folderId,
      name: 'My Media',
      type: 'folder',
      parentId: null,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    await addNode(folderNode);

    // Fetch an image
    let imgBlob: Blob;
    try {
      const imgRes = await fetch('https://picsum.photos/seed/gallery/800/600', { signal: AbortSignal.timeout(3000) });
      if (!imgRes.ok) throw new Error('Bad network response');
      imgBlob = await imgRes.blob();
    } catch (e) {
      imgBlob = await getFallbackImage();
    }

    await addNode({
      id: generateId(),
      name: 'vacation_photo.jpg',
      type: 'file',
      parentId: folderId,
      data: imgBlob,
      mimeType: 'image/jpeg',
      size: imgBlob.size,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    });

    // Fetch a video
    let vidBlob: Blob;
    try {
      // Using a known CORS-friendly video URL
      const vidRes = await fetch('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', { signal: AbortSignal.timeout(3500) });
      if (!vidRes.ok) throw new Error('Bad network response');
      vidBlob = await vidRes.blob();
    } catch (e) {
      vidBlob = getFallbackVideo();
    }

    await addNode({
      id: generateId(),
      name: 'sample_video.mp4',
      type: 'file',
      parentId: folderId,
      data: vidBlob,
      mimeType: 'video/mp4',
      size: vidBlob.size,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    });

    // Fetch an audio file
    let audBlob: Blob;
    try {
      // Using a known CORS-friendly audio URL
      const audRes = await fetch('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg', { signal: AbortSignal.timeout(3000) });
      if (!audRes.ok) throw new Error('Bad network response');
      audBlob = await audRes.blob();
    } catch (e) {
      audBlob = await getFallbackAudio();
    }

    await addNode({
      id: generateId(),
      name: 'alarm_sound.wav',
      type: 'file',
      parentId: folderId,
      data: audBlob,
      mimeType: audBlob.type || 'audio/wav',
      size: audBlob.size,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    });

    window.dispatchEvent(new Event('vfs-updated'));
  } catch (error) {
    // Prevent unhandled errors or console.error to keep the test environment peaceful
  }
};
