import React from 'react';
import { Users, Zap, TrendingUp } from 'lucide-react';

export default function CollaborationStyleCard({ data }) {
  if (!data) return null;

  const {
    soloPercentage,
    coWorkingPercentage,
    completionMultiplier,
    primaryRole,
    description,
    strength,
    suggestion
  } = data;

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold">Your Collaboration Style</h3>
      </div>

      {/* Solo vs Co-working Split */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">Solo vs Co-working</span>
          <span className="font-semibold">{soloPercentage}% solo / {coWorkingPercentage}% co-working</span>
        </div>
        
        <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden flex">
          <div 
            className="bg-gradient-to-r from-purple-500 to-fuchsia-500"
            style={{ width: `${soloPercentage}%` }}
          />
          <div 
            className="bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{ width: `${coWorkingPercentage}%` }}
          />
        </div>
      </div>

      {/* Primary Role Badge */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Primary role: {primaryRole} ⭐</span>
        </div>
        <p className="text-sm text-slate-300 mb-1">{description}</p>
        <p className="text-xs text-slate-400">{strength}</p>
      </div>

      {/* Completion Multiplier */}
      {completionMultiplier > 1 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-2xl font-bold text-blue-400">{completionMultiplier}×</span>
          </div>
          <p className="text-xs text-slate-400">Your completion rate when co-working vs solo</p>
        </div>
      )}

      {/* Suggestion */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
        <p className="text-sm text-purple-300">
          💡 <span className="font-semibold">Try:</span> {suggestion}
        </p>
      </div>
    </div>
  );
}
