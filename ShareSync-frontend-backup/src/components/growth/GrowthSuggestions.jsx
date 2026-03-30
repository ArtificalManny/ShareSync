// src/components/growth/GrowthSuggestions.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: AI-Generated Growth Suggestions (High Contrast Responsive)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Sparkles, Target, Lightbulb, Rocket, ChevronRight,
  CheckCircle2, Clock, TrendingUp
} from 'lucide-react';

const PRIORITY_CONFIG = {
  high: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', label: 'High Priority' },
  medium: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Medium' },
  low: { color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10', label: 'Nice to Have' },
};

const TYPE_ICONS = {
  skill: Target,
  behavior: Lightbulb,
  stretch: Rocket,
};

function SuggestionCard({ suggestion, onStartAction }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedItems, setCompletedItems] = useState([]);

  const priorityConfig = PRIORITY_CONFIG[suggestion.priority] || PRIORITY_CONFIG.medium;
  const TypeIcon = TYPE_ICONS[suggestion.type] || Lightbulb;

  const toggleItem = (index) => {
    setCompletedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const progress = suggestion.actionItems?.length 
    ? (completedItems.length / suggestion.actionItems.length) * 100 
    : 0;

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-4 mb-3">
        <div className={`p-2.5 rounded-lg ${priorityConfig.bg}`}>
          <TypeIcon className={`w-5 h-5 ${priorityConfig.color}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`
              text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded
              ${priorityConfig.bg} ${priorityConfig.color}
            `}>
              {priorityConfig.label}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">{suggestion.title}</h4>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-4">{suggestion.description}</p>

      {/* Reason (AI insight) */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 mb-4">
        <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-slate-700 dark:text-violet-200 italic">{suggestion.reason}</p>
      </div>

      {/* Meta Row */}
      <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          {suggestion.expectedImpact}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {suggestion.timeEstimate}
        </span>
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Progress</span>
            <span className="text-teal-600 dark:text-teal-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-teal-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Items */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full py-2.5 rounded-lg text-sm font-bold
          text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200
          hover:bg-slate-50 dark:hover:bg-white/5 transition-colors
          flex items-center justify-center gap-2 border border-transparent hover:border-slate-200 dark:hover:border-white/10
        "
      >
        {isExpanded ? 'Hide action items' : 'Show action items'}
        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {isExpanded && suggestion.actionItems && (
        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2">
          {suggestion.actionItems.map((item, i) => (
            <button
              key={i}
              onClick={() => toggleItem(i)}
              className={`
                w-full flex items-start gap-3 p-3.5 rounded-xl text-left border
                ${completedItems.includes(i) 
                  ? 'bg-teal-50/50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20' 
                  : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'}
                hover:shadow-sm transition-all
              `}
            >
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors
                ${completedItems.includes(i) 
                  ? 'bg-teal-500 border-teal-500' 
                  : 'border-slate-300 dark:border-zinc-500 bg-white dark:bg-transparent'
                }
              `}>
                {completedItems.includes(i) && (
                  <CheckCircle2 className="w-3 h-3 text-white" />
                )}
              </div>
              <span className={`
                text-sm font-medium leading-snug
                ${completedItems.includes(i) ? 'text-slate-400 dark:text-zinc-500 line-through' : 'text-slate-800 dark:text-zinc-200'}
              `}>
                {item}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GrowthSuggestions({
  suggestions = [],
  loading,
  onStartAction,
  className = '',
}) {
  const [filter, setFilter] = useState('all');

  const filteredSuggestions = filter === 'all'
    ? suggestions
    : suggestions.filter(s => s.priority === filter);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2].map(i => (
          <div key={i} className="p-5 rounded-xl bg-white dark:bg-[#1a1a1c] border border-slate-200/80 dark:border-white/5 animate-pulse">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800" />
              <div className="flex-1">
                <div className="h-3 w-20 bg-slate-100 dark:bg-zinc-800 rounded mb-2" />
                <div className="h-5 w-3/4 bg-slate-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
            <div className="h-4 w-full bg-slate-100 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          <h3 className="text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white">Growth Suggestions</h3>
          <span className="px-2.5 py-1 rounded-md bg-violet-100 dark:bg-violet-500/20 text-[10px] font-black uppercase tracking-wider text-violet-800 dark:text-violet-300">
            AI-Powered
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {['all', 'high', 'medium', 'low'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider
              ${filter === f
                ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-500/30'
                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white border-transparent'
              }
              border transition-all
            `}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Suggestions */}
      <div className="space-y-4">
        {filteredSuggestions.length > 0 ? (
          filteredSuggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onStartAction={onStartAction}
            />
          ))
        ) : (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
            <Sparkles className="w-8 h-8 text-slate-400 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">No suggestions match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
