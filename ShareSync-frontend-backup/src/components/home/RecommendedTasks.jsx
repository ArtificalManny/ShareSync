// src/components/home/RecommendedTasks.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 4: Information Architecture
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ZONE PATTERN (Asana-style consistent scanning):
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ ZONE 1: Identity      │ ZONE 2: Status              │ ZONE 3: Action        │
// │ ──────────────────    │ ──────────────────          │ ──────────────────    │
// │ Priority dot + Title  │ Time estimate               │ Start button          │
// │ Reason (why AI picked)│                             │ Chevron on hover      │
// └─────────────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Zap, Clock, ChevronRight, Sparkles } from 'lucide-react';

const RecommendedTasks = ({ 
  recommendations = [
    { id: 1, title: 'Finalize UI Components', reason: 'High impact on sprint goal', estimatedTime: '45m', priority: 'high' },
    { id: 2, title: 'Update Documentation', reason: 'Onboard new members faster', estimatedTime: '20m', priority: 'normal' }
  ],
  onStartTask 
}) => {
  return (
    <div className="mt-6 rounded-xl bg-surface-1 border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-medium text-text-primary">Recommended for You</h3>
        </div>
        <span className="text-[10px] font-medium text-warning bg-warning/10 px-2 py-0.5 rounded">
          AI Priority
        </span>
      </div>
      
      {/* Task List */}
      <div className="divide-y divide-white/[0.04]">
        {recommendations.map((item) => (
          <div
            key={item.id}
            onClick={() => onStartTask?.(item)}
            className="
              group flex items-center gap-4 px-4 py-3
              hover:bg-surface-2 transition-colors duration-200
              cursor-pointer
            "
          >
            {/* ═══════════════════════════════════════════════════════════════
                ZONE 1: Identity (What should I do?)
                Priority indicator + Title + AI reason
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Priority dot - high = warning, normal = subtle */}
              <div className={`
                w-2 h-2 rounded-full shrink-0
                ${item.priority === 'high' ? 'bg-warning' : 'bg-surface-3'}
              `} />

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-text-tertiary mt-0.5 truncate">
                  {item.reason}
                </p>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                ZONE 2: Status (How long will it take?)
                Time estimate - the key info for deciding
            ═══════════════════════════════════════════════════════════════ */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-text-tertiary">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{item.estimatedTime}</span>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                ZONE 3: Action (What can I do?)
                Start button + chevron
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={(e) => { e.stopPropagation(); onStartTask?.(item); }}
                className="
                  px-3 py-1.5 rounded-lg text-xs font-medium
                  bg-surface-2 text-text-secondary
                  hover:bg-brand hover:text-white
                  opacity-0 group-hover:opacity-100
                  transition-all duration-200
                "
              >
                Start
              </button>

              <ChevronRight className="
                w-4 h-4 text-text-tertiary
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
              " />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedTasks;
