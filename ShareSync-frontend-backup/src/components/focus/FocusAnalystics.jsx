// src/components/focus/FocusAnalytics.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS FORTRESS: Analytics & Insights
// Track focus patterns and provide actionable suggestions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { 
  BarChart2, Clock, Zap, TrendingUp, TrendingDown,
  Target, Calendar, Brain, Lightbulb, Award,
  Sun, Moon, Coffee, ChevronRight
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateAnalytics(focusHistory = []) {
  if (focusHistory.length === 0) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      averageDuration: 0,
      completionRate: 0,
      peakHours: [],
      weeklyTrend: 0,
      suggestedDuration: 25,
      bestDay: null,
      currentStreak: 0,
    };
  }
  
  // Basic stats
  const totalSessions = focusHistory.length;
  const totalMinutes = focusHistory.reduce((sum, s) => sum + (s.duration / 60), 0);
  const averageDuration = totalMinutes / totalSessions;
  const completedSessions = focusHistory.filter(s => s.completed).length;
  const completionRate = (completedSessions / totalSessions) * 100;
  
  // Peak hours analysis
  const hourCounts = {};
  focusHistory.forEach(session => {
    const hour = new Date(session.date).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const peakHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
  
  // Weekly trend (this week vs last week)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeekMinutes = focusHistory
    .filter(s => new Date(s.date) >= oneWeekAgo)
    .reduce((sum, s) => sum + (s.duration / 60), 0);
  
  const lastWeekMinutes = focusHistory
    .filter(s => new Date(s.date) >= twoWeeksAgo && new Date(s.date) < oneWeekAgo)
    .reduce((sum, s) => sum + (s.duration / 60), 0);
  
  const weeklyTrend = lastWeekMinutes > 0 
    ? ((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100
    : 0;
  
  // Suggested duration based on completion rate
  let suggestedDuration = 25;
  if (averageDuration > 0) {
    const completedAvg = focusHistory
      .filter(s => s.completed)
      .reduce((sum, s, _, arr) => sum + (s.duration / 60) / arr.length, 0);
    suggestedDuration = Math.round(completedAvg / 5) * 5 || 25; // Round to 5 min
  }
  
  // Best day of week
  const dayCounts = {};
  focusHistory.forEach(session => {
    const day = new Date(session.date).getDay();
    dayCounts[day] = (dayCounts[day] || 0) + (session.duration / 60);
  });
  
  const bestDayNum = Object.entries(dayCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const bestDay = bestDayNum !== undefined ? dayNames[parseInt(bestDayNum)] : null;
  
  // Current streak
  let currentStreak = 0;
  const sortedDates = [...new Set(
    focusHistory.map(s => new Date(s.date).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a));
  
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diff = (prevDate - currDate) / (1000 * 60 * 60 * 24);
      if (diff <= 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  return {
    totalSessions,
    totalMinutes,
    averageDuration,
    completionRate,
    peakHours,
    weeklyTrend,
    suggestedDuration,
    bestDay,
    currentStreak,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({ icon: Icon, label, value, subValue, trend, color = 'brand' }) {
  const colorClasses = {
    brand: 'bg-brand-500/10 text-brand-400',
    success: 'bg-success-500/10 text-success-400',
    warning: 'bg-warning-500/10 text-warning-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  };
  
  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-success-400' : 'text-error-400'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(Math.round(trend))}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-text-primary mb-1">{value}</div>
      <div className="text-xs text-text-tertiary">{label}</div>
      {subValue && (
        <div className="text-xs text-text-secondary mt-1">{subValue}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PEAK HOURS CHART
// ═══════════════════════════════════════════════════════════════════════════════

function PeakHoursChart({ peakHours, focusHistory }) {
  // Calculate hour distribution
  const hourData = useMemo(() => {
    const counts = Array(24).fill(0);
    focusHistory.forEach(session => {
      const hour = new Date(session.date).getHours();
      counts[hour] += session.duration / 60;
    });
    const max = Math.max(...counts);
    return counts.map(c => max > 0 ? c / max : 0);
  }, [focusHistory]);
  
  const formatHour = (h) => {
    if (h === 0) return '12a';
    if (h === 12) return '12p';
    return h < 12 ? `${h}a` : `${h - 12}p`;
  };
  
  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-4">
        <Sun className="w-4 h-4 text-warning-400" />
        <span className="text-sm font-medium text-text-primary">Peak Focus Hours</span>
      </div>
      
      {/* Chart */}
      <div className="flex items-end gap-0.5 h-16 mb-2">
        {hourData.slice(6, 22).map((value, idx) => (
          <div
            key={idx}
            className={`
              flex-1 rounded-t transition-all duration-300
              ${peakHours.includes(idx + 6) ? 'bg-brand-500' : 'bg-surface-3'}
            `}
            style={{ height: `${Math.max(value * 100, 4)}%` }}
            title={`${formatHour(idx + 6)}: ${Math.round(hourData[idx + 6] * 100)}%`}
          />
        ))}
      </div>
      
      {/* Labels */}
      <div className="flex justify-between text-[10px] text-text-tertiary">
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>10pm</span>
      </div>
      
      {/* Peak time text */}
      {peakHours.length > 0 && (
        <div className="mt-3 text-xs text-text-secondary">
          Your peak: <span className="text-brand-400 font-medium">
            {peakHours.map(h => formatHour(h)).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUGGESTION CARD
// ═══════════════════════════════════════════════════════════════════════════════

function SuggestionCard({ suggestion }) {
  return (
    <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-brand-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-brand-400 mb-1">
            {suggestion.title}
          </div>
          <div className="text-xs text-text-secondary">
            {suggestion.description}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FOCUS ANALYTICS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FocusAnalytics - Focus patterns and insights
 */
export function FocusAnalytics({
  focusHistory = [],
  className = '',
}) {
  const analytics = useMemo(() => calculateAnalytics(focusHistory), [focusHistory]);
  
  // Generate suggestions
  const suggestions = useMemo(() => {
    const suggestions = [];
    
    if (analytics.completionRate < 70 && analytics.averageDuration > 30) {
      suggestions.push({
        title: 'Try shorter sessions',
        description: `Your average is ${Math.round(analytics.averageDuration)}m but completion rate is ${Math.round(analytics.completionRate)}%. Try ${analytics.suggestedDuration}-minute Pomodoros.`,
      });
    }
    
    if (analytics.peakHours.length > 0) {
      const peakHourStr = analytics.peakHours[0];
      const hour = peakHourStr < 12 ? `${peakHourStr}am` : `${peakHourStr - 12 || 12}pm`;
      suggestions.push({
        title: `Schedule focus time around ${hour}`,
        description: `You're most productive around ${hour}. Block this time on your calendar.`,
      });
    }
    
    if (analytics.currentStreak === 0) {
      suggestions.push({
        title: 'Start a focus streak',
        description: 'Complete one focus session daily to build momentum.',
      });
    }
    
    return suggestions;
  }, [analytics]);
  
  const formatMinutes = (mins) => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remaining = Math.round(mins % 60);
      return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
    }
    return `${Math.round(mins)}m`;
  };
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-surface-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="text-lg font-semibold text-text-primary">
              Focus Analytics
            </div>
            <div className="text-sm text-text-tertiary">
              Your deep work patterns
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard
            icon={Clock}
            label="Total Focus Time"
            value={formatMinutes(analytics.totalMinutes)}
            subValue={`${analytics.totalSessions} sessions`}
            color="brand"
          />
          <StatCard
            icon={Target}
            label="Avg Duration"
            value={formatMinutes(analytics.averageDuration)}
            color="cyan"
          />
          <StatCard
            icon={Zap}
            label="Completion Rate"
            value={`${Math.round(analytics.completionRate)}%`}
            trend={analytics.weeklyTrend}
            color="success"
          />
          <StatCard
            icon={Award}
            label="Current Streak"
            value={`${analytics.currentStreak} days`}
            color="warning"
          />
        </div>
        
        {/* Peak hours */}
        {focusHistory.length > 0 && (
          <div className="mb-4">
            <PeakHoursChart 
              peakHours={analytics.peakHours} 
              focusHistory={focusHistory}
            />
          </div>
        )}
        
        {/* Best day */}
        {analytics.bestDay && (
          <div className="p-3 rounded-xl bg-surface-1 border border-white/[0.06] mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-text-tertiary" />
              <span className="text-text-secondary">Best day:</span>
              <span className="font-medium text-text-primary">{analytics.bestDay}</span>
            </div>
          </div>
        )}
        
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Suggestions
            </div>
            {suggestions.slice(0, 2).map((suggestion, idx) => (
              <SuggestionCard key={idx} suggestion={suggestion} />
            ))}
          </div>
        )}
        
        {/* Empty state */}
        {focusHistory.length === 0 && (
          <div className="py-8 text-center">
            <Brain className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <div className="text-sm text-text-tertiary">
              Complete your first focus session to see analytics
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI ANALYTICS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniFocusStats - Compact stats for dashboard
 */
export function MiniFocusStats({
  focusHistory = [],
  onViewFull,
  className = '',
}) {
  const analytics = useMemo(() => calculateAnalytics(focusHistory), [focusHistory]);
  
  const todayMinutes = useMemo(() => {
    const today = new Date().toDateString();
    return focusHistory
      .filter(s => new Date(s.date).toDateString() === today)
      .reduce((sum, s) => sum + (s.duration / 60), 0);
  }, [focusHistory]);
  
  return (
    <button
      onClick={onViewFull}
      className={`
        w-full flex items-center gap-4 p-4 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 transition-colors
        text-left group
        ${className}
      `}
    >
      <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
        <BarChart2 className="w-6 h-6 text-brand-400" />
      </div>
      
      <div className="flex-1">
        <div className="text-sm font-medium text-text-primary mb-1">
          Today's Focus
        </div>
        <div className="text-2xl font-bold text-brand-400">
          {Math.round(todayMinutes)}m
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-xs text-text-tertiary mb-1">Streak</div>
        <div className="text-lg font-bold text-warning-400">
          {analytics.currentStreak}🔥
        </div>
      </div>
      
      <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

export default FocusAnalytics;