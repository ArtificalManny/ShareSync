// src/components/retro/WeeklyRetro.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.4: Weekly Retro - Main Component
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  ChevronRight, 
  Download, 
  Share2,
  Sparkles,
} from 'lucide-react';
import useWeeklyRetro from '../../hooks/useWeeklyRetro';
import WeeklyStats from './WeeklyStats';
import { InsightList, TopInsight } from './RetroInsightCard';
import PeakHoursChart, { DayOfWeekChart } from './PeakHoursChart';
import CategoryBreakdown from './CategoryBreakdown';
import CollaborationInsight from './CollaborationInsight';

/**
 * WeeklyRetro - Main weekly retrospective modal/page
 */
export default function WeeklyRetro({ 
  isOpen, 
  onClose,
  isModal = true,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    loading,
    error,
    weeklyData,
    insights,
    summary,
    stats,
    previousWeekComparison,
    markAsViewed,
  } = useWeeklyRetro();

  // Mark as viewed when opened
  useEffect(() => {
    if (isOpen) {
      markAsViewed();
    }
  }, [isOpen, markAsViewed]);

  if (!isOpen && isModal) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'insights', label: 'Insights' },
    { id: 'patterns', label: 'Patterns' },
  ];

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-brand" />
            <span className="text-sm font-medium text-brand">Weekly Retro</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">
            {summary?.headline || 'Your Week in Review'}
          </h2>
          <p className="text-text-secondary mt-1">
            {summary?.subtext || 'Here\'s how you performed this week'}
          </p>
        </div>
        
        {/* Grade badge */}
        {summary?.grade && (
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            text-2xl font-black
            ${getGradeStyles(summary.grade)}
          `}>
            {summary.grade}
          </div>
        )}
      </div>

      {/* Week indicator */}
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <Calendar className="w-4 h-4" />
        <span>{getWeekDateRange()}</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2 px-4 rounded-lg text-sm font-medium
              transition-all
              ${activeTab === tab.id
                ? 'bg-surface-1 text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-tertiary">Analyzing your week...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-center">
          <p className="text-error">Failed to load retro data</p>
        </div>
      )}

      {/* Content based on active tab */}
      {!loading && !error && (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <WeeklyStats stats={stats} comparison={previousWeekComparison} />
              
              {/* Top insight */}
              {insights.length > 0 && (
                <TopInsight insight={insights[0]} />
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <InsightList insights={insights} />
          )}

          {activeTab === 'patterns' && (
            <div className="space-y-6">
              {/* Peak hours */}
              {stats?.hourlyDistribution && (
                <PeakHoursChart hourlyDistribution={stats.hourlyDistribution} />
              )}
              
              {/* Day of week */}
              {stats?.dailyDistribution && (
                <DayOfWeekChart dailyDistribution={stats.dailyDistribution} />
              )}
              
              {/* Categories */}
              {stats?.categories && (
                <CategoryBreakdown categories={stats.categories} />
              )}
              
              {/* Collaboration */}
              <CollaborationInsight 
                collaborations={weeklyData?.collaborations || []}
              />
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <button
            className="
              flex items-center gap-2 px-3 py-2 rounded-lg
              text-text-tertiary hover:text-text-secondary hover:bg-surface-2
              transition-colors text-sm
            "
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            className="
              flex items-center gap-2 px-3 py-2 rounded-lg
              text-text-tertiary hover:text-text-secondary hover:bg-surface-2
              transition-colors text-sm
            "
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
        
        {isModal && (
          <button
            onClick={onClose}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg
              bg-brand text-white font-medium
              hover:bg-brand-600
              transition-colors
            "
          >
            Done
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="
          relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
          p-6 rounded-2xl
          bg-surface-0 border border-white/[0.08]
          shadow-2xl
        ">
          {/* Close button */}
          <button
            onClick={onClose}
            className="
              absolute top-4 right-4 p-2 rounded-lg
              text-text-tertiary hover:text-text-primary hover:bg-surface-2
              transition-colors
            "
          >
            <X className="w-5 h-5" />
          </button>
          
          {content}
        </div>
      </div>
    );
  }

  return content;
}

/**
 * Get grade-based styles
 */
function getGradeStyles(grade) {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'bg-success/20 text-success border-2 border-success/30';
    case 'B+':
    case 'B':
      return 'bg-brand/20 text-brand border-2 border-brand/30';
    case 'B-':
    case 'C+':
      return 'bg-warning/20 text-warning border-2 border-warning/30';
    default:
      return 'bg-surface-2 text-text-secondary border-2 border-white/[0.08]';
  }
}

/**
 * Get current week date range
 */
function getWeekDateRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const format = (date) => date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  return `${format(monday)} - ${format(sunday)}`;
}

/**
 * WeeklyRetroTrigger - Button to open the retro
 */
export function WeeklyRetroTrigger({ onClick, hasNew = false }) {
  return (
    <button
      onClick={onClick}
      className="
        relative flex items-center gap-2 px-4 py-2 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-brand/20
        transition-all
      "
    >
      <Sparkles className="w-4 h-4 text-brand" />
      <span className="text-sm font-medium text-text-primary">Weekly Retro</span>
      
      {hasNew && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand animate-pulse" />
      )}
    </button>
  );
}
