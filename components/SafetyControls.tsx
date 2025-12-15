import React from 'react';
import { HarmCategory, HarmBlockThreshold, SafetySetting } from '../types';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';

interface SafetyControlsProps {
  settings: SafetySetting[];
  onUpdate: (category: HarmCategory, threshold: HarmBlockThreshold) => void;
}

const CATEGORY_LABELS: Record<HarmCategory, string> = {
  [HarmCategory.HARM_CATEGORY_HARASSMENT]: 'Harassment',
  [HarmCategory.HARM_CATEGORY_HATE_SPEECH]: 'Hate Speech',
  [HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT]: 'Sexually Explicit',
  [HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT]: 'Dangerous Content',
};

const THRESHOLD_LABELS: Record<HarmBlockThreshold, string> = {
  [HarmBlockThreshold.BLOCK_NONE]: 'Block None',
  [HarmBlockThreshold.BLOCK_ONLY_HIGH]: 'Block Only High',
  [HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE]: 'Block Medium & Above',
  [HarmBlockThreshold.BLOCK_LOW_AND_ABOVE]: 'Block Low & Above',
};

const SafetyControls: React.FC<SafetyControlsProps> = ({ settings, onUpdate }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-slate-100">Safety Settings</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.map((setting) => (
          <div key={setting.category} className="flex flex-col gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              {getIconForCategory(setting.category)}
              {CATEGORY_LABELS[setting.category]}
            </label>
            <select
              value={setting.threshold}
              onChange={(e) => onUpdate(setting.category, e.target.value as HarmBlockThreshold)}
              className="w-full bg-slate-800 text-slate-200 text-sm rounded-md px-3 py-2 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            >
              {Object.values(HarmBlockThreshold).map((threshold) => (
                <option key={threshold} value={threshold}>
                  {THRESHOLD_LABELS[threshold]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-4 italic">
        *Adjusting these settings allows you to control how strict the model is when generating content.
      </p>
    </div>
  );
};

const getIconForCategory = (category: HarmCategory) => {
  switch (category) {
    case HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT:
      return <ShieldAlert className="w-4 h-4 text-red-400" />;
    case HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT:
      return <ShieldX className="w-4 h-4 text-pink-400" />;
    default:
      return <Shield className="w-4 h-4 text-blue-400" />;
  }
};

export default SafetyControls;