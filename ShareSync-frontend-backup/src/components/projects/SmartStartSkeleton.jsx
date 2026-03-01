// src/components/projects/SmartStartSkeleton.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.1: Loading skeleton while AI generates plan
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function SmartStartSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header shimmer */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <div>
          <div className="h-4 w-48 bg-slate-700/50 rounded mb-1.5" />
          <div className="h-3 w-32 bg-slate-700/30 rounded" />
        </div>
      </div>

      {/* Task cards shimmer */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-purple-500/10 bg-slate-800/30"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-700/50 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-700/30 rounded w-full mb-1" />
              <div className="h-3 bg-slate-700/30 rounded w-2/3" />
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="h-5 w-14 bg-slate-700/30 rounded-full" />
              <div className="h-5 w-10 bg-slate-700/30 rounded-full" />
            </div>
          </div>
        </div>
      ))}

      {/* Timeline shimmer */}
      <div className="flex items-center gap-4 pt-2">
        <div className="h-4 w-24 bg-slate-700/40 rounded" />
        <div className="h-4 w-20 bg-slate-700/30 rounded" />
        <div className="h-4 w-28 bg-slate-700/30 rounded" />
      </div>

      {/* Status message */}
      <div className="text-center pt-2">
        <p className="text-sm text-purple-400 animate-pulse">
          ✨ AI is analyzing your project and generating tasks...
        </p>
      </div>
    </div>
  );
}
