// src/components/story/ProjectTimeline.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE J: Main Project Timeline Component
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { History, RefreshCw, ChevronDown } from 'lucide-react';
import TimelineFilters from './TimelineFilters';
import TimelineEvent from './TimelineEvent';
import { formatTimelineDate } from '../../utils/timelineFilters';

export default function ProjectTimeline({
  groupedEvents = [],
  stats,
  filters,
  loading,
  onFilterChange,
  onClearFilters,
  onEventClick,
  onRefresh,
  className = '',
}) {
  const [visibleGroups, setVisibleGroups] = useState(5);

  const hasMore = groupedEvents.length > visibleGroups;
  const displayedGroups = groupedEvents.slice(0, visibleGroups);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-24 bg-surface-2 rounded mb-4" />
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-2" />
              <div className="flex-1 p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
                <div className="h-5 w-3/4 bg-surface-2 rounded mb-2" />
                <div className="h-4 w-1/2 bg-surface-2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-semibold text-text-primary">Project Timeline</h2>
          <span className="px-2 py-0.5 rounded-full bg-surface-2 text-xs text-text-tertiary">
            {stats?.total || 0} events
          </span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-text-tertiary" />
          </button>
        )}
      </div>

      {/* Filters */}
      <TimelineFilters
        filters={filters}
        onFilterChange={onFilterChange}
        onClear={onClearFilters}
        stats={stats}
        className="mb-6"
      />

      {/* Timeline */}
      <div className="space-y-8">
        {displayedGroups.length > 0 ? (
          displayedGroups.map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-xs font-medium text-text-tertiary px-3 py-1 rounded-full bg-surface-2">
                  {formatTimelineDate(group.date)}
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* Events */}
              <div>
                {group.events.map((event, i) => (
                  <TimelineEvent
                    key={event.id}
                    event={event}
                    isLast={i === group.events.length - 1}
                    onClick={onEventClick}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <History className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary">No events match your filters</p>
            <button
              onClick={onClearFilters}
              className="mt-2 text-sm text-brand hover:text-brand-400"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setVisibleGroups(prev => prev + 5)}
          className="
            w-full mt-6 py-3 rounded-xl
            bg-surface-1 border border-white/[0.06]
            text-sm text-text-tertiary
            hover:bg-surface-2 hover:text-text-secondary
            transition-colors flex items-center justify-center gap-2
          "
        >
          <ChevronDown className="w-4 h-4" />
          Load more ({groupedEvents.length - visibleGroups} remaining)
        </button>
      )}
    </div>
  );
}
