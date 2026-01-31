// src/components/story/TimelineFilters.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE J: Timeline Filter Controls
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { 
  List, Rocket, AlertTriangle, GitBranch, Flag, Search, X, Filter 
} from 'lucide-react';
import { EVENT_TYPES } from '../../utils/timelineFilters';

const TYPE_ICONS = {
  all: List,
  ship: Rocket,
  blocker: AlertTriangle,
  decision: GitBranch,
  milestone: Flag,
};

export default function TimelineFilters({
  filters,
  onFilterChange,
  onClear,
  stats,
  className = '',
}) {
  const activeFilters = Object.keys(filters).filter(k => filters[k] && k !== 'type');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(EVENT_TYPES).map(([key, config]) => {
          const Icon = TYPE_ICONS[key];
          const isActive = filters.type === key || (!filters.type && key === 'all');
          const count = key === 'all' ? stats?.total : stats?.byType?.[key];

          return (
            <button
              key={key}
              onClick={() => onFilterChange({ type: key === 'all' ? undefined : key })}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                transition-all duration-200
                ${isActive
                  ? 'bg-brand/10 text-brand border border-brand/20'
                  : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{config.label}</span>
              {count !== undefined && (
                <span className={`
                  px-1.5 py-0.5 rounded text-[10px] font-medium
                  ${isActive ? 'bg-brand/20' : 'bg-surface-3'}
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Additional Filters */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="
              w-full pl-10 pr-4 py-2 rounded-lg
              bg-surface-2 border border-white/[0.06]
              text-sm text-text-primary placeholder-text-tertiary
              focus:outline-none focus:border-brand/30
            "
          />
        </div>

        {/* Clear Filters */}
        {activeFilters.length > 0 && (
          <button
            onClick={onClear}
            className="
              flex items-center gap-1.5 px-3 py-2 rounded-lg
              text-sm text-text-tertiary hover:text-text-secondary
              hover:bg-surface-2 transition-colors
            "
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
