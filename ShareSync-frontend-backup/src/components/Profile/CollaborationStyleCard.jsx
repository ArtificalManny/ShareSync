import React from 'react';
import { Users, Lightbulb } from 'lucide-react';

export default function CollaborationStyleCard({ data }) {
  if (!data) return null;

  const { soloPercentage, coworkingPercentage, primaryRole, completionMultiplier, suggestion } = data;

  return (
    <div className="modern-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="heading-3">Your Collaboration Style</h3>
      </div>

      {/* Split bar visualization */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="caption-text">Solo vs Co-working</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {soloPercentage}% / {coworkingPercentage}%
          </span>
        </div>
        
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
            style={{ width: `${soloPercentage}%` }}
          />
          <div 
            className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-400 transition-all duration-500"
            style={{ width: `${coworkingPercentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">Solo</span>
          <span className="text-fuchsia-600 dark:text-fuchsia-400 font-medium">Co-working</span>
        </div>
      </div>

      <div className="divider-modern" />

      {/* Role badge */}
      <div className="space-y-2">
        <div className="caption-text">Primary role</div>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-500/5 border border-amber-200 dark:border-amber-500/20">
          <span className="text-2xl">⭐</span>
          <span className="font-semibold text-amber-900 dark:text-amber-300">
            {primaryRole}
          </span>
        </div>
      </div>

      {/* Multiplier stat */}
      {completionMultiplier > 1 && (
        <div className="stat-card-modern bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <div className="stat-label text-emerald-600 dark:text-emerald-400">Co-working boost</div>
          <div className="stat-value text-emerald-700 dark:text-emerald-300">
            {completionMultiplier.toFixed(1)}×
          </div>
          <div className="caption-text text-emerald-600 dark:text-emerald-400">
            more completions when co-working
          </div>
        </div>
      )}

      {/* Suggestion */}
      {suggestion && (
        <>
          <div className="divider-modern" />
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10">
            <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {suggestion}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
