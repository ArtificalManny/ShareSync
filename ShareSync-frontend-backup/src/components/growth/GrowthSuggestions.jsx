// src/components/growth/GrowthSuggestions.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE K: AI-Generated Growth Suggestions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Sparkles, Target, Lightbulb, Rocket, ChevronRight,
  CheckCircle2, Clock, TrendingUp
} from 'lucide-react';

const PRIORITY_CONFIG = {
  high: { color: 'text-error-500', bg: 'bg-error-500/10', label: 'High Priority' },
  medium: { color: 'text-warning', bg: 'bg-warning/10', label: 'Medium' },
  low: { color: 'text-success', bg: 'bg-success/10', label: 'Nice to Have' },
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
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${priorityConfig.bg}`}>
          <TypeIcon className={`w-4 h-4 ${priorityConfig.color}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`
              text-[10px] font-medium px-1.5 py-0.5 rounded
              ${priorityConfig.bg} ${priorityConfig.color}
            `}>
              {priorityConfig.label}
            </span>
          </div>
          <h4 className="font-medium text-text-primary">{suggestion.title}</h4>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary mb-3">{suggestion.description}</p>

      {/* Reason (AI insight) */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-brand/5 border border-brand/10 mb-3">
        <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <p className="text-xs text-text-tertiary italic">{suggestion.reason}</p>
      </div>

      {/* Meta Row */}
      <div className="flex items-center gap-4 text-xs text-text-tertiary mb-3">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-success" />
          {suggestion.expectedImpact}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {suggestion.timeEstimate}
        </span>
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-tertiary">Progress</span>
            <span className="text-success">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
            <div 
              className="h-full bg-success transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Items */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full py-2 rounded-lg text-sm
          text-text-tertiary hover:text-text-secondary
          hover:bg-surface-2 transition-colors
          flex items-center justify-center gap-1
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
                w-full flex items-start gap-3 p-3 rounded-lg text-left
                ${completedItems.includes(i) ? 'bg-success/5' : 'bg-surface-2/50'}
                hover:bg-surface-2 transition-colors
              `}
            >
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
                ${completedItems.includes(i) 
                  ? 'bg-success border-success' 
                  : 'border-text-tertiary'
                }
              `}>
                {completedItems.includes(i) && (
                  <CheckCircle2 className="w-3 h-3 text-white" />
                )}
              </div>
              <span className={`
                text-sm
                ${completedItems.includes(i) ? 'text-text-tertiary line-through' : 'text-text-secondary'}
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
          <div key={i} className="p-4 rounded-xl bg-surface-1 border border-white/[0.06] animate-pulse">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-surface-2" />
              <div className="flex-1">
                <div className="h-3 w-20 bg-surface-2 rounded mb-2" />
                <div className="h-5 w-3/4 bg-surface-2 rounded" />
              </div>
            </div>
            <div className="h-4 w-full bg-surface-2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand" />
          <h3 className="font-semibold text-text-primary">Growth Suggestions</h3>
          <span className="px-2 py-0.5 rounded-full bg-brand/10 text-xs text-brand">
            AI-powered
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', 'high', 'medium', 'low'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1.5 rounded-lg text-xs capitalize
              ${filter === f
                ? 'bg-brand/10 text-brand'
                : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
              }
              transition-colors
            `}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        {filteredSuggestions.length > 0 ? (
          filteredSuggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onStartAction={onStartAction}
            />
          ))
        ) : (
          <div className="py-8 text-center">
            <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-tertiary">No suggestions match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
