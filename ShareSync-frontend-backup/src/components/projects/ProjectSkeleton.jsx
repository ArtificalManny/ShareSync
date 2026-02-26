// src/components/projects/ProjectSkeleton.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7.1: Skeleton Audit
// UPGRADED: Replaced basic lines with a structural skeleton that perfectly 
// matches the layout, paddings, and elements of ProjectGridCard.jsx.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';

export default function ProjectSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-white border border-slate-200/60 overflow-hidden">
      <div className="animate-pulse">
        {/* Header: Emoji box + Streak pill */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100" />
          <div className="w-12 h-6 rounded-md bg-slate-100" />
        </div>

        {/* Title + Description lines */}
        <div className="h-5 w-3/4 bg-slate-200 rounded mb-3" />
        <div className="h-3 w-full bg-slate-100 rounded mb-2" />
        <div className="h-3 w-2/3 bg-slate-100 rounded mb-5" />

        {/* Next Step Box */}
        <div className="bg-slate-50 rounded-lg p-3.5 mb-5 border border-slate-100">
          <div className="h-2 w-16 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-full bg-slate-200 rounded" />
        </div>

        {/* Velocity Progress */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <div className="h-2 w-12 bg-slate-200 rounded" />
            <div className="h-3 w-8 bg-slate-200 rounded" />
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full w-full" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-7 w-24 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
