import React, { useState, useEffect, useCallback, useRef } from 'react';
import { checkApiKeySelection, openApiKeySelection, generateImage } from './services/geminiService';
import SafetyControls from './components/SafetyControls';
import ImageSettings from './components/ImageSettings';
import { HarmCategory, HarmBlockThreshold, SafetySetting, AspectRatio, ImageResolution } from './types';
import { Sparkles, Image as ImageIcon, Key, Loader2, Download, AlertCircle } from 'lucide-react';

const DEFAULT_SAFETY_SETTINGS: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export default function App() {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('');
  const [safetySettings, setSafetySettings] = useState<SafetySetting[]>(DEFAULT_SAFETY_SETTINGS);
  
  // New State for Image Config
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [resolution, setResolution] = useState<ImageResolution>('1K');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progressInterval = useRef<any>(null);

  // Initial check for API Key
  useEffect(() => {
    checkApiKeySelection().then(setHasKey);
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const handleConnectKey = async () => {
    try {
      await openApiKeySelection();
      // Assume success if no error thrown, check again
      const selected = await checkApiKeySelection();
      setHasKey(selected);
    } catch (e) {
      console.error("Failed to select key", e);
      setError("Failed to select API key. Please try again.");
    }
  };

  const handleSafetyUpdate = useCallback((category: HarmCategory, threshold: HarmBlockThreshold) => {
    setSafetySettings(prev => 
      prev.map(s => s.category === category ? { ...s, threshold } : s)
    );
  }, []);

  const simulateProgress = (res: ImageResolution) => {
    setProgress(0);
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    // Estimated durations: 1K (~5s), 2K (~10s), 4K (~20s)
    // These are heuristics to make the progress bar feel responsive
    const duration = res === '4K' ? 20000 : res === '2K' ? 10000 : 5000;
    const intervalTime = 100;
    const steps = duration / intervalTime;
    const increment = 95 / steps; // Target 95% until complete

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        return prev + increment;
      });
    }, intervalTime);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    simulateProgress(resolution);

    try {
      const imageData = await generateImage(prompt, safetySettings, aspectRatio, resolution);
      
      // Generation complete
      setProgress(100);
      if (progressInterval.current) clearInterval(progressInterval.current);

      // Small delay to allow the bar to visually hit 100%
      await new Promise(r => setTimeout(r, 300));
      
      setGeneratedImage(imageData);
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `nanogen-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
            <Key className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Authentication Required</h1>
          <p className="text-slate-400 mb-8">
            To use the <span className="text-indigo-400 font-semibold">Gemini 3 Pro</span> model (Nano Banana Pro), you need to connect your Google Cloud Project with a valid payment method.
          </p>
          <button
            onClick={handleConnectKey}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            Connect API Key
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <div className="mt-6 text-xs text-slate-600">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:text-slate-400 underline">
              View Billing Documentation
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">NanoGen Pro</h1>
              <p className="text-xs text-indigo-400 font-medium">Powered by Gemini 3 Pro</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Prompt Section */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Image Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city with flying cars in a neon noir style..."
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
            />
            
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className={`mt-4 w-full py-3.5 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg
                ${isLoading || !prompt.trim() 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25 active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </button>
          </div>

          {/* Image Configuration */}
          <ImageSettings 
            aspectRatio={aspectRatio} 
            setAspectRatio={setAspectRatio}
            resolution={resolution}
            setResolution={setResolution}
          />

          {/* Safety Settings */}
          <SafetyControls settings={safetySettings} onUpdate={handleSafetyUpdate} />

        </div>

        {/* Right Column: Result */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl h-full min-h-[500px] flex flex-col overflow-hidden relative">
            
            {generatedImage ? (
              <div className="relative flex-1 group bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                <img 
                  src={generatedImage} 
                  alt={prompt}
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={handleDownload}
                    className="bg-black/50 hover:bg-black/70 backdrop-blur-md text-white p-3 rounded-xl border border-white/10 shadow-lg transition-all active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8">
                {isLoading ? (
                   <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500 w-full max-w-sm">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center shadow-lg shadow-indigo-500/10 z-10 relative">
                          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        </div>
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                      </div>
                      
                      <div className="w-full space-y-2">
                        <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                           <span>Creating masterpiece...</span>
                           <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                           <div 
                              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-200 ease-out"
                              style={{ width: `${progress}%` }}
                           />
                        </div>
                        <p className="text-xs text-slate-500 text-center pt-2">
                           Gemini 3 Pro is processing your request at {resolution} resolution.
                        </p>
                      </div>
                   </div>
                ) : error ? (
                  <div className="text-center max-w-md">
                     <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                     </div>
                     <h3 className="text-lg font-semibold text-slate-200 mb-2">Generation Failed</h3>
                     <p className="text-slate-400">{error}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700 border-dashed">
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-400">Ready to Create</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                      Enter a detailed prompt, choose your resolution, and adjust safety settings to generate high-quality images.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
              <span>{resolution} • {aspectRatio} • Gemini 3 Pro</span>
              <span>{generatedImage ? 'Generation Complete' : isLoading ? 'Processing...' : 'Waiting for input'}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}