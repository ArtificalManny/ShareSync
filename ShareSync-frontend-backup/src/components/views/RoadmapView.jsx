// src/components/views/RoadmapView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP VIEW: Timeline with confidence visualization
// See the big picture, track milestones, understand dependencies
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Plus, Filter, ChevronLeft, ChevronRight, Calendar,
  Target, AlertTriangle, CheckCircle2, Clock, Users,
  ArrowRight, Milestone, Flag, Zap, Eye
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function TimelineHeader({ startDate, months, viewMode, onViewModeChange }) {
  return (
    <div className="flex border-b border-white/[0.06]">
      {/* Row labels column */}
      <div className="w-72 flex-shrink-0 px-4 py-3 bg-surface-1 border-r border-white/[0.06]">
        <span className="text-sm font-medium text-text-secondary">Milestones</span>
      </div>
      
      {/* Timeline months */}
      <div className="flex-1 flex">
        {months.map((month, idx) => (
          <div 
            key={idx}
            className="flex-1 min-w-[120px] px-4 py-3 border-r border-white/[0.06] last:border-r-0"
          >
            <span className="text-sm font-medium text-text-secondary">{month.label}</span>
            <div className="text-xs text-text-tertiary mt-0.5">{month.year}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MILESTONE ROW
// ═══════════════════════════════════════════════════════════════════════════════

function MilestoneRow({ milestone, timelineStart, timelineEnd, totalDays, onMilestoneClick }) {
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return { bg: 'bg-success-500', text: 'text-success-400', light: 'bg-success-500/20' };
    if (confidence >= 60) return { bg: 'bg-warning-500', text: 'text-warning-400', light: 'bg-warning-500/20' };
    return { bg: 'bg-error-500', text: 'text-error-400', light: 'bg-error-500/20' };
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return { label: 'Completed', color: 'bg-success-500/15 text-success-400' };
      case 'on_track': return { label: 'On Track', color: 'bg-success-500/15 text-success-400' };
      case 'at_risk': return { label: 'At Risk', color: 'bg-warning-500/15 text-warning-400' };
      case 'behind': return { label: 'Behind', color: 'bg-error-500/15 text-error-400' };
      default: return { label: 'Planned', color: 'bg-surface-2 text-text-tertiary' };
    }
  };
  
  // Calculate position and width
  const startDate = new Date(milestone.startDate);
  const endDate = new Date(milestone.endDate);
  const startOffset = Math.max(0, (startDate - timelineStart) / (1000 * 60 * 60 * 24));
  const duration = (endDate - startDate) / (1000 * 60 * 60 * 24);
  
  const leftPercent = (startOffset / totalDays) * 100;
  const widthPercent = (duration / totalDays) * 100;
  
  const confidence = milestone.confidence || 75;
  const colors = getConfidenceColor(confidence);
  const status = getStatusBadge(milestone.status);
  
  return (
    <div className="flex border-b border-white/[0.06] hover:bg-surface-1/50 transition-colors">
      {/* Milestone Info */}
      <div 
        className="w-72 flex-shrink-0 px-4 py-4 border-r border-white/[0.06] cursor-pointer"
        onClick={() => onMilestoneClick?.(milestone)}
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg ${colors.light} flex items-center justify-center flex-shrink-0`}>
            {milestone.icon || <Milestone className={`w-4 h-4 ${colors.text}`} />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-text-primary truncate">{milestone.title}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                {status.label}
              </span>
              <span className="text-xs text-text-tertiary">
                {milestone.tasksComplete}/{milestone.tasksTotal} tasks
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline Bar */}
      <div className="flex-1 relative py-4 px-4">
        {/* Grid lines would go here */}
        
        {/* Milestone bar */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 h-10 rounded-lg overflow-hidden cursor-pointer group"
          style={{ left: `${leftPercent}%`, width: `${Math.max(widthPercent, 5)}%` }}
          onClick={() => onMilestoneClick?.(milestone)}
        >
          {/* Background bar (uncertainty range) */}
          <div className={`absolute inset-0 ${colors.light} rounded-lg`} />
          
          {/* Progress bar */}
          <div 
            className={`absolute inset-y-0 left-0 ${colors.bg} rounded-l-lg transition-all duration-500`}
            style={{ width: `${milestone.progress || 0}%` }}
          />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <span className="text-xs font-medium text-white truncate">
              {milestone.title}
            </span>
            <span className={`text-xs font-bold ${colors.text}`}>
              {confidence}%
            </span>
          </div>
          
          {/* Hover tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-surface-1 border border-white/[0.08] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            <div className="text-xs text-text-secondary">
              {new Date(milestone.startDate).toLocaleDateString()} — {new Date(milestone.endDate).toLocaleDateString()}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {confidence}% confidence · {milestone.progress}% complete
            </div>
          </div>
        </div>
        
        {/* Dependencies would render as arrows here */}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TODAY LINE
// ═══════════════════════════════════════════════════════════════════════════════

function TodayLine({ timelineStart, totalDays }) {
  const today = new Date();
  const daysFromStart = (today - timelineStart) / (1000 * 60 * 60 * 24);
  const leftPercent = (daysFromStart / totalDays) * 100;
  
  if (leftPercent < 0 || leftPercent > 100) return null;
  
  return (
    <div 
      className="absolute top-0 bottom-0 w-px bg-brand-500 z-10"
      style={{ left: `calc(288px + ${leftPercent}% * (100% - 288px) / 100)` }}
    >
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-brand-500 text-white text-[10px] font-bold">
        TODAY
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function RoadmapView({ 
  milestones = [], 
  onMilestoneClick,
  onAddMilestone 
}) {
  const [viewMode, setViewMode] = useState('quarters'); // months, quarters
  const [showDependencies, setShowDependencies] = useState(true);
  
  // Calculate timeline range
  const timelineConfig = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 5, 0);
    
    const months = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      months.push({
        label: current.toLocaleDateString('en-US', { month: 'short' }),
        year: current.getFullYear(),
        date: new Date(current)
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    
    return { startDate, endDate, months, totalDays };
  }, [viewMode]);
  
  // Mock milestones if none provided
  const displayMilestones = milestones.length > 0 ? milestones : [
    {
      id: '1',
      title: 'Beta Launch',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      progress: 65,
      confidence: 85,
      status: 'on_track',
      tasksComplete: 12,
      tasksTotal: 18
    },
    {
      id: '2',
      title: 'API v2 Migration',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      progress: 30,
      confidence: 62,
      status: 'at_risk',
      tasksComplete: 5,
      tasksTotal: 15
    },
    {
      id: '3',
      title: 'Mobile App Launch',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      progress: 15,
      confidence: 45,
      status: 'behind',
      tasksComplete: 3,
      tasksTotal: 20
    }
  ];
  
  return (
    <div className="p-10 max-w-full mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onAddMilestone}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary text-sm hover:bg-surface-2 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          
          <button 
            onClick={() => setShowDependencies(!showDependencies)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors
              ${showDependencies 
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' 
                : 'bg-surface-1 border-white/[0.08] text-text-secondary hover:bg-surface-2'
              }
            `}
          >
            <ArrowRight className="w-4 h-4" />
            <span>Dependencies</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-1 border border-white/[0.08]">
            <Calendar className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">Q1 — Q2 2026</span>
          </div>
          
          <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success-500" />
          <span className="text-text-tertiary">On Track (80%+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning-500" />
          <span className="text-text-tertiary">Monitor (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error-500" />
          <span className="text-text-tertiary">At Risk (&lt;60%)</span>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="relative rounded-xl border border-white/[0.06] bg-surface-0 overflow-hidden">
        {/* Today line */}
        <TodayLine 
          timelineStart={timelineConfig.startDate} 
          totalDays={timelineConfig.totalDays}
        />
        
        {/* Header */}
        <TimelineHeader 
          months={timelineConfig.months}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        
        {/* Milestone rows */}
        <div>
          {displayMilestones.map(milestone => (
            <MilestoneRow
              key={milestone.id}
              milestone={milestone}
              timelineStart={timelineConfig.startDate}
              timelineEnd={timelineConfig.endDate}
              totalDays={timelineConfig.totalDays}
              onMilestoneClick={onMilestoneClick}
            />
          ))}
        </div>
        
        {/* Empty state */}
        {displayMilestones.length === 0 && (
          <div className="py-20 text-center">
            <Target className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No milestones yet</h3>
            <p className="text-sm text-text-tertiary mb-6">Create your first milestone to start planning</p>
            <button
              onClick={onAddMilestone}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
            >
              Add Milestone
            </button>
          </div>
        )}
      </div>
      
      {/* Scenario Runner */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-brand-500/10 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-sm font-medium text-text-primary">What-If Simulator</div>
              <div className="text-xs text-text-tertiary">See how changes affect your timeline</div>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-colors">
            Run Scenario
          </button>
        </div>
      </div>
    </div>
  );
}
