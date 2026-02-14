// src/components/roadmap/RoadmapView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Roadmap View Component - Main view for displaying project milestones
// ⚠️ Uses /milestones?projectId=xxx endpoint (matches your backend)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Flag,
  Grid,
  List,
  Calendar,
  Plus,
  Filter,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import MilestoneCard from './MilestoneCard';
import MilestoneRow from './MilestoneRow';
import MilestoneTimeline from './MilestoneTimeline';

/* ─────────────────────────────────────────────────────────────────────────
   SKELETON COMPONENTS
───────────────────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06] animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 w-24 bg-surface-3 rounded-md" />
      <div className="h-6 w-6 bg-surface-3 rounded" />
    </div>
    <div className="h-5 w-3/4 bg-surface-3 rounded mb-2" />
    <div className="h-4 w-full bg-surface-3 rounded mb-4" />
    <div className="h-3 w-1/2 bg-surface-3 rounded mb-4" />
    <div className="h-2 w-full bg-surface-3 rounded mb-3" />
    <div className="flex justify-between pt-3 border-t border-white/[0.06]">
      <div className="h-4 w-16 bg-surface-3 rounded" />
      <div className="h-4 w-4 bg-surface-3 rounded" />
    </div>
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-1 border border-white/[0.06] animate-pulse">
    <div className="h-7 w-24 bg-surface-3 rounded-md" />
    <div className="flex-1 h-4 bg-surface-3 rounded" />
    <div className="w-32 h-2 bg-surface-3 rounded-full" />
    <div className="w-16 h-4 bg-surface-3 rounded" />
    <div className="w-16 h-4 bg-surface-3 rounded" />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────────────── */
const EmptyState = ({ onCreateMilestone }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-6">
      <Flag className="w-8 h-8 text-brand" />
    </div>
    <h3 className="text-lg font-semibold text-text-primary mb-2">
      No milestones yet
    </h3>
    <p className="text-sm text-text-secondary max-w-sm mb-6">
      Create your first milestone to start tracking progress on your project roadmap.
    </p>
    {onCreateMilestone && (
      <button
        onClick={onCreateMilestone}
        className="
          flex items-center gap-2 px-4 py-2.5 rounded-lg
          bg-brand text-white text-sm font-medium
          hover:bg-brand-600 hover:shadow-glow-brand
          transition-all duration-200
        "
      >
        <Plus className="w-4 h-4" />
        Create Milestone
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   ERROR STATE
───────────────────────────────────────────────────────────────────────── */
const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-error-500/10 flex items-center justify-center mb-6">
      <AlertCircle className="w-8 h-8 text-error-500" />
    </div>
    <h3 className="text-lg font-semibold text-text-primary mb-2">
      Failed to load milestones
    </h3>
    <p className="text-sm text-text-secondary max-w-sm mb-6">
      {error?.message || 'Something went wrong while fetching milestones.'}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="
          flex items-center gap-2 px-4 py-2.5 rounded-lg
          bg-surface-2 text-text-primary text-sm font-medium
          hover:bg-surface-3 border border-white/[0.06]
          transition-all duration-200
        "
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   VIEW MODES
───────────────────────────────────────────────────────────────────────── */
const VIEW_MODES = {
  grid: { icon: Grid, label: 'Grid' },
  list: { icon: List, label: 'List' },
  timeline: { icon: Calendar, label: 'Timeline' },
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'at_risk', label: 'At Risk' },
];

/* ─────────────────────────────────────────────────────────────────────────
   NORMALIZE MILESTONE - Handle different status formats
───────────────────────────────────────────────────────────────────────── */
const normalizeMilestone = (milestone) => {
  // Backend uses 'in_progress', frontend components might expect 'in-progress'
  const status = milestone?.status?.replace('_', '-') || 'planned';
  
  return {
    ...milestone,
    status,
    // Ensure common fields exist with fallbacks
    title: milestone?.title || milestone?.name || 'Untitled Milestone',
    dueDate: milestone?.dueDate || milestone?.targetDate,
    completedTasks: milestone?.completedTasks || 0,
    totalTasks: milestone?.totalTasks || 0,
  };
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
const RoadmapView = ({
  // Data props (can come from parent or hook)
  milestones: propMilestones = [],
  isLoading = false,
  error = null,
  
  // Callbacks
  onMilestoneClick,
  onCreateMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Normalize milestones for consistent display
  const normalizedMilestones = useMemo(() => {
    return propMilestones.map(normalizeMilestone);
  }, [propMilestones]);

  // Filter milestones
  const filteredMilestones = useMemo(() => {
    if (statusFilter === 'all') return normalizedMilestones;
    const filterValue = statusFilter.replace('-', '_'); // Convert back for comparison
    return normalizedMilestones.filter((m) => {
      const milestoneStatus = m.status?.replace('-', '_');
      return milestoneStatus === filterValue;
    });
  }, [normalizedMilestones, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = normalizedMilestones.length;
    const completed = normalizedMilestones.filter((m) => m.status === 'completed').length;
    const inProgress = normalizedMilestones.filter((m) => 
      m.status === 'in-progress' || m.status === 'in_progress'
    ).length;
    const atRisk = normalizedMilestones.filter((m) => 
      m.status === 'at-risk' || m.status === 'at_risk'
    ).length;
    return { total, completed, inProgress, atRisk };
  }, [normalizedMilestones]);

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return viewMode === 'list' ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (error) {
      return <ErrorState error={error} onRetry={onRefresh} />;
    }

    if (!filteredMilestones.length) {
      return <EmptyState onCreateMilestone={onCreateMilestone} />;
    }

    switch (viewMode) {
      case 'timeline':
        return (
          <MilestoneTimeline
            milestones={filteredMilestones}
            onMilestoneClick={onMilestoneClick}
          />
        );

      case 'list':
        return (
          <div className="space-y-3">
            {filteredMilestones.map((milestone) => (
              <MilestoneRow
                key={milestone._id || milestone.id}
                milestone={milestone}
                onClick={onMilestoneClick}
              />
            ))}
          </div>
        );

      case 'grid':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone._id || milestone.id}
                milestone={milestone}
                onClick={onMilestoneClick}
                onEdit={onEditMilestone}
                onDelete={onDeleteMilestone}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-brand" />
          <span className="text-sm font-medium text-text-primary">{stats.total}</span>
          <span className="text-xs text-text-tertiary">Total</span>
        </div>
        <div className="h-4 w-px bg-white/[0.1]" />
        <div className="flex items-center gap-4 text-xs">
          <span className="text-success">{stats.completed} completed</span>
          <span className="text-brand">{stats.inProgress} in progress</span>
          {stats.atRisk > 0 && (
            <span className="text-error-500">{stats.atRisk} at risk</span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* Left: Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="
              flex items-center gap-2 px-3 py-2 rounded-lg
              bg-surface-1 border border-white/[0.06] text-sm
              text-text-secondary hover:text-text-primary hover:bg-surface-2
              transition-all duration-200
            "
          >
            <Filter className="w-4 h-4" />
            <span>{STATUS_FILTERS.find((f) => f.value === statusFilter)?.label || 'All'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="
                absolute left-0 top-full mt-1 z-20
                w-40 py-1 rounded-lg
                bg-surface-2 border border-white/[0.08]
                shadow-lg shadow-black/20
              ">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setStatusFilter(filter.value);
                      setShowFilterMenu(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-sm text-left
                      ${statusFilter === filter.value
                        ? 'text-brand bg-brand/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
                      }
                      transition-colors
                    `}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: View Toggle + Create */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-surface-1 rounded-lg border border-white/[0.06]">
            {Object.entries(VIEW_MODES).map(([mode, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`
                    p-2 rounded-md transition-all
                    ${viewMode === mode
                      ? 'bg-surface-2 text-text-primary'
                      : 'text-text-tertiary hover:text-text-secondary'
                    }
                  `}
                  title={config.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Create Button */}
          {onCreateMilestone && (
            <button
              onClick={onCreateMilestone}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-brand text-white text-sm font-medium
                hover:bg-brand-600 hover:shadow-glow-brand
                transition-all duration-200
              "
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Milestone</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default RoadmapView;
