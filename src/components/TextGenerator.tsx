import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, ArrowLeft, Wand2, Copy, Check, Loader2, Sparkles, SlidersHorizontal, RefreshCw, Paperclip, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

interface TextGeneratorProps {
  onBack: () => void;
  isVpnConnected?: boolean;
}

const TONES = [
  { id: 'professional', name: 'Professional' },
  { id: 'casual', name: 'Casual' },
  { id: 'creative', name: 'Creative' },
  { id: 'persuasive', name: 'Persuasive' }
];

const LENGTHS = [
  { id: 'short', name: 'Short' },
  { id: 'medium', name: 'Medium' },
  { id: 'long', name: 'Long' }
];

export function TextGenerator({ onBack, isVpnConnected }: TextGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{name: string; type: string; base64: string}[]>([]);
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1];
          setAttachedFiles(prev => [...prev, { name: file.name, type: file.type, base64 }]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const refinePrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsRefining(true);
    setError(null);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured.');
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const fullPrompt = `Make the following prompt more specific, detailed, and actionable for a text generation AI. Expand the prompt to include better context and instructions. Return ONLY the refined prompt without any preamble or explanation:\n\n${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: fullPrompt,
      });

      if (response.text) {
        setPrompt(response.text.trim());
      } else {
        throw new Error('Failed to refine prompt.');
      }
    } catch (err: any) {
      console.error('Error refining prompt:', err);
      setError(err.message || 'An error occurred while refining the prompt.');
    } finally {
      setIsRefining(false);
    }
  };

  const generateText = async () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedText('');

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured.');
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const fullPrompt = `Generate a ${length} text in a ${tone} tone about the following topic/prompt:\n\n${prompt}\n\nPlease format the text beautifully using markdown. Utilize headings (##, ###), bullet points, bold/italic text, and code blocks where appropriate, to make the output structured and engaging.`;

      let contents: any = fullPrompt;
      if (attachedFiles.length > 0) {
        contents = [
          ...attachedFiles.map(file => ({
            inlineData: {
              mimeType: file.type || 'application/octet-stream',
              data: file.base64
            }
          })),
          fullPrompt
        ];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: contents,
        config: {
          maxOutputTokens: 8192,
        }
      });

      if (response.text) {
        setGeneratedText(response.text);
      } else {
        throw new Error('Failed to generate text.');
      }
    } catch (err: any) {
      console.error('Error generating text:', err);
      setError(err.message || 'An error occurred while generating text.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col bg-[#0f0f0f] text-white"
    >
      <div className="flex items-center gap-4 p-4 mt-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 ios-icon hidden sm:flex">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white/90 font-sans">ৡRABBY EFTYৡ Writer</h1>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              <p className="text-[10px] text-blue-400/80 font-bold uppercase tracking-widest">Text Engine</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col items-center justify-center pt-8 pb-4 space-y-6">
            <div className="w-20 h-20 bg-[#1A1A1A] rounded-3xl flex items-center justify-center border border-white/5 shadow-inner">
              <FileText className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-sm text-center text-white/70 max-w-xs font-medium leading-relaxed">
              Describe what you want to write, and let AI shape your thoughts into words.
            </p>
          </div>

          <div className="bg-[#111111]/80 backdrop-blur-3xl rounded-[2rem] p-4 space-y-3 border border-white/5 shadow-2xl relative mx-auto max-w-xl w-full">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What should we write about today?"
                className="w-full min-h-[8rem] bg-white/5 border border-white/5 rounded-[1rem] p-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 shadow-inner resize-y custom-scrollbar pb-12 pt-10"
              />
              
              <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
                {attachedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-lg pl-2 pr-1 py-1 pointer-events-auto border border-white/10 shadow-lg">
                    <span className="text-xs text-white/80 max-w-[100px] truncate">{file.name}</span>
                    <button onClick={() => removeFile(i)} className="p-0.5 hover:bg-white/10 rounded-full transition-colors">
                      <X className="w-3 h-3 text-white/60 hover:text-white" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-3 left-3">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                />
                <label 
                  htmlFor="file-upload"
                  className="cursor-pointer p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-white/10"
                  title="Attach files (PDF, images, etc.)"
                >
                  <Paperclip className="w-4 h-4" />
                </label>
              </div>

              <button
                onClick={refinePrompt}
                disabled={!prompt.trim() || isRefining || isGenerating}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Refine Prompt
              </button>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase ml-1">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors border ${tone === t.id ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase ml-1">Length</label>
                <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 w-fit">
                  {LENGTHS.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setLength(l.id)}
                      className={`px-4 py-1.5 text-[10px] font-bold rounded-xl transition-all duration-300 ${length === l.id ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-white/30 hover:text-white/60'}`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={generateText}
                disabled={(!prompt.trim() && attachedFiles.length === 0) || isGenerating}
                className={`flex-1 h-[3.5rem] rounded-[1rem] font-medium tracking-wide flex items-center justify-center gap-2 transition-all ${
                  (!prompt.trim() && attachedFiles.length === 0) || isGenerating ? 'bg-blue-600/50 text-white/50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                }`}
              >
                 {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Wand2 className="w-4 h-4" /> Generate Text</>}
              </button>
            </div>
            
            {error && (
               <p className="text-center text-xs text-rose-400 font-medium py-2">{error}</p>
            )}
          </div>

          <AnimatePresence>
            {generatedText && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 mx-auto max-w-xl w-full relative group mt-8 shadow-xl"
              >
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([generatedText], {type: 'text/plain'});
                      element.href = URL.createObjectURL(file);
                      element.download = "Generated-Text.txt";
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 rotate-[-90deg] inline-block -mt-1 mr-1" />
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                
                <h3 className="text-xs font-bold text-blue-400 tracking-widest uppercase mb-4">Generated Content</h3>
                
                <div className="prose prose-invert prose-sm max-w-none text-white/80 mt-4 prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 relative group">
                  <Markdown>{generatedText}</Markdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </div>
    </motion.div>
  );
}
