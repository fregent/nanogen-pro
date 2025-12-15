import React from 'react';
import { AspectRatio, ImageResolution } from '../types';
import { Settings2, Monitor, Square, Smartphone, Maximize, RectangleVertical, RectangleHorizontal } from 'lucide-react';

interface ImageSettingsProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  resolution: ImageResolution;
  setResolution: (res: ImageResolution) => void;
}

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: React.ReactNode }[] = [
  { value: '1:1', label: '1:1', icon: <Square className="w-4 h-4" /> },
  { value: '16:9', label: '16:9', icon: <Monitor className="w-4 h-4" /> },
  { value: '9:16', label: '9:16', icon: <Smartphone className="w-4 h-4" /> },
  { value: '4:3', label: '4:3', icon: <RectangleHorizontal className="w-4 h-4" /> },
  { value: '3:4', label: '3:4', icon: <RectangleVertical className="w-4 h-4" /> },
];

const RESOLUTIONS: ImageResolution[] = ['1K', '2K', '4K'];

const ImageSettings: React.FC<ImageSettingsProps> = ({
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-slate-100">Image Configuration</h3>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Aspect Ratio */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">Aspect Ratio</label>
          <div className="grid grid-cols-5 gap-2">
            {ASPECT_RATIOS.map((option) => (
              <button
                key={option.value}
                onClick={() => setAspectRatio(option.value)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all gap-2
                  ${aspectRatio === option.value
                    ? 'bg-purple-600/20 border-purple-500/50 text-purple-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                title={option.label}
              >
                <div className="opacity-70">{option.icon}</div>
                <span className="hidden sm:inline">{option.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">Resolution</label>
           <div className="grid grid-cols-3 gap-2">
            {RESOLUTIONS.map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-all
                  ${resolution === res
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                  }`}
              >
                {res}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Higher resolutions (2K, 4K) provide more detail but may take longer to generate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageSettings;