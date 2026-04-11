// src/components/roadmap/RoadmapView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Roadmap View Component - Main view for displaying project milestones
// ⭐ FIX: Now fetches milestones directly when projectId is provided
// ⭐ Backward compatible: still accepts milestones as props
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Target,
} from 'lucide-react';
import client from '../../api/client';

/* ─────────────────────────────────────────────────────────────────────────
   API FUNCTIONS
───────────────────────────────────────────────────────────────────────── */

/**
 * Fetch milestones for a project
 * Tries multiple endpoint patterns to ensure compatibility
 */
async function fetchMilestones(projectId) {
  if (!projectId) return [];
  
  // Try different endpoint patterns
  const endpoints = [
    `/milestones?projectId=${projectId}`,
    `/projects/${projectId}/milestones`,
    `/milestones/project/${projectId}`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await client.get(endpoint);
      const data = response?.data;
      
      // Handle different response shapes
      if (Array.isArray(data)) return data;
      if (data?.milestones && Array.isArray(data.milestones)) return data.milestones;
      if (data?.data && Array.isArray(data.data)) return data.data;
      if (data?.items && Array.isArray(data.items)) return data.items;
      
      // If we got here with a 200, but no array, try next endpoint
      console.log(`[RoadmapView] Endpoint ${endpoint} returned non-array:`, data);
    } catch (err) {
      // 404 is expected for some endpoints, try next
      if (err?.response?.status === 404) {
        console.log(`[RoadmapView] Endpoint ${endpoint} not found, trying next...`);
        continue;
      }
      // Other errors, log but try next
      console.warn(`[RoadmapView] Error fetching from ${endpoint}:`, err?.message);
    }
  }
  
  console.warn('[RoadmapView] All milestone endpoints failed for project:', projectId);
  return [];
}

/* ─────────────────────────────────────────────────────────────────────────
   SKELETON COMPONENTS
───────────────────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="p-5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 w-24 bg-slate-100 dark:bg-white/10 rounded-md" />
      <div className="h-6 w-6 bg-slate-100 dark:bg-white/10 rounded" />
    </div>
    <div className="h-5 w-3/4 bg-slate-100 dark:bg-white/10 rounded mb-2" />
    <div className="h-4 w-full bg-slate-100 dark:bg-white/10 rounded mb-4" />
    <div className="h-3 w-1/2 bg-slate-100 dark:bg-white/10 rounded mb-4" />
    <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded mb-3" />
    <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
      <div className="h-4 w-16 bg-slate-100 dark:bg-white/10 rounded" />
      <div className="h-4 w-4 bg-slate-100 dark:bg-white/10 rounded" />
    </div>
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 animate-pulse">
    <div className="h-7 w-24 bg-slate-100 dark:bg-white/10 rounded-md" />
    <div className="flex-1 h-4 bg-slate-100 dark:bg-white/10 rounded" />
    <div className="w-32 h-2 bg-slate-100 dark:bg-white/10 rounded-full" />
    <div className="w-16 h-4 bg-slate-100 dark:bg-white/10 rounded" />
    <div className="w-16 h-4 bg-slate-100 dark:bg-white/10 rounded" />
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
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
      No milestones yet
    </h3>
    <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mb-6">
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
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
      Failed to load milestones
    </h3>
    <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mb-6">
      {error?.message || 'Something went wrong while fetching milestones.'}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="
          flex items-center gap-2 px-4 py-2.5 rounded-lg
          bg-slate-50 dark:bg-[#27272a] text-slate-900 dark:text-white text-sm font-medium
          hover:bg-slate-100 dark:hover:bg-[#3f3f46] border border-slate-200 dark:border-white/10
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
   STATUS HELPERS
───────────────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  planned: {
    label: 'Planned',
    color: 'text-slate-500 dark:text-zinc-400',
    bg: 'bg-slate-100 dark:bg-white/[0.08]',
    icon: Clock,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-brand',
    bg: 'bg-brand/10',
    icon: Target,
  },
  'in_progress': {
    label: 'In Progress',
    color: 'text-brand',
    bg: 'bg-brand/10',
    icon: Target,
  },
  completed: {
    label: 'Completed',
    color: 'text-success',
    bg: 'bg-success/10',
    icon: CheckCircle2,
  },
  'at-risk': {
    label: 'At Risk',
    color: 'text-error-500',
    bg: 'bg-error-500/10',
    icon: AlertTriangle,
  },
  'at_risk': {
    label: 'At Risk',
    color: 'text-error-500',
    bg: 'bg-error-500/10',
    icon: AlertTriangle,
  },
};

const getStatusConfig = (status) => {
  const normalized = status?.toLowerCase?.()?.replace('-', '_') || 'planned';
  return STATUS_CONFIG[normalized] || STATUS_CONFIG.planned;
};

/* ─────────────────────────────────────────────────────────────────────────
   NORMALIZE MILESTONE - Handle different API response formats
───────────────────────────────────────────────────────────────────────── */
const normalizeMilestone = (milestone) => {
  if (!milestone) return null;
  
  // Extract ID
  const id = milestone._id || milestone.id || milestone.milestoneId;
  if (!id) {
    console.warn('[RoadmapView] Milestone missing ID:', milestone);
    return null;
  }
  
  // Normalize status (backend uses 'in_progress', frontend might use 'in-progress')
  const rawStatus = milestone?.status || 'planned';
  const status = rawStatus.replace('_', '-');
  
  // Extract title from various possible fields
  const title = 
    milestone?.title || 
    milestone?.name || 
    milestone?.label ||
    milestone?.milestone?.title ||
    'Untitled Milestone';
  
  // Extract description
  const description = 
    milestone?.description || 
    milestone?.summary ||
    milestone?.details ||
    '';
  
  // Extract dates
  const dueDate = milestone?.dueDate || milestone?.targetDate || milestone?.endDate;
  const startDate = milestone?.startDate || milestone?.createdAt;
  
  // Extract task counts
  const completedTasks = milestone?.completedTasks || milestone?.tasksCompleted || 0;
  const totalTasks = milestone?.totalTasks || milestone?.taskCount || 0;
  
  // Calculate progress
  const progress = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : (milestone?.progress || 0);
  
  return {
    ...milestone,
    id,
    _id: id,
    status,
    title,
    description,
    dueDate,
    startDate,
    completedTasks,
    totalTasks,
    progress,
  };
};

/* ─────────────────────────────────────────────────────────────────────────
   MILESTONE CARD COMPONENT
───────────────────────────────────────────────────────────────────────── */
const MilestoneCard = ({ milestone, onClick, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const statusConfig = getStatusConfig(milestone.status);
  const StatusIcon = statusConfig.icon;
  
  const progress = milestone.progress || 0;
  const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && milestone.status !== 'completed';
  
  return (
    <div 
      className="
        group p-5 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        hover:shadow-md dark:hover:bg-[#27272a] hover:border-slate-300 dark:hover:border-white/20
        transition-all duration-200 cursor-pointer
      "
      onClick={() => onClick?.(milestone)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
          ${statusConfig.bg} ${statusConfig.color}
        `}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>
        
        {(onEdit || onDelete) && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                <div className="absolute right-0 top-full mt-1 z-20 w-32 py-1 rounded-lg bg-white dark:bg-[#27272a] border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-black/40">
                  {onEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(milestone); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-sm text-left text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(milestone); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-sm text-left text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Title & Description */}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2">
        {milestone.title}
      </h3>
      {milestone.description && (
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4 line-clamp-2">
          {milestone.description}
        </p>
      )}
      
      {/* Due Date */}
      {milestone.dueDate && (
        <div className={`flex items-center gap-1.5 text-xs mb-4 ${isOverdue ? 'text-error-500' : 'text-slate-500 dark:text-zinc-500'}`}>
          <Clock className="w-3 h-3" />
          <span>
            {isOverdue ? 'Overdue: ' : 'Due: '}
            {new Date(milestone.dueDate).toLocaleDateString()}
          </span>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              milestone.status === 'completed' ? 'bg-success' :
              isOverdue ? 'bg-error-500' : 'bg-brand'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
        <span className="text-xs text-slate-500 dark:text-zinc-400">
          {milestone.completedTasks}/{milestone.totalTasks} tasks
        </span>
        <span className={`text-xs font-medium ${
          progress >= 100 ? 'text-success' : 
          progress >= 50 ? 'text-brand' : 'text-slate-500 dark:text-zinc-400'
        }`}>
          {progress}%
        </span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MILESTONE ROW COMPONENT
───────────────────────────────────────────────────────────────────────── */
const MilestoneRow = ({ milestone, onClick }) => {
  const statusConfig = getStatusConfig(milestone.status);
  const StatusIcon = statusConfig.icon;
  const progress = milestone.progress || 0;
  const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && milestone.status !== 'completed';
  
  return (
    <div 
      className="
        flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        hover:shadow-sm dark:hover:bg-[#27272a] hover:border-slate-300 dark:hover:border-white/20
        transition-all duration-200 cursor-pointer
      "
      onClick={() => onClick?.(milestone)}
    >
      {/* Status Badge */}
      <span className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium min-w-[100px]
        ${statusConfig.bg} ${statusConfig.color}
      `}>
        <StatusIcon className="w-3 h-3" />
        {statusConfig.label}
      </span>
      
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {milestone.title}
        </h3>
      </div>
      
      {/* Progress Bar */}
      <div className="w-32 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              milestone.status === 'completed' ? 'bg-success' :
              isOverdue ? 'bg-error-500' : 'bg-brand'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-zinc-400 w-8 text-right">{progress}%</span>
      </div>
      
      {/* Tasks */}
      <span className="text-xs text-slate-500 dark:text-zinc-400 w-20 text-right">
        {milestone.completedTasks}/{milestone.totalTasks} tasks
      </span>
      
      {/* Due Date */}
      <span className={`text-xs w-24 text-right ${isOverdue ? 'text-error-500' : 'text-slate-500 dark:text-zinc-400'}`}>
        {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : '—'}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MILESTONE TIMELINE COMPONENT
───────────────────────────────────────────────────────────────────────── */
const MilestoneTimeline = ({ milestones, onMilestoneClick }) => {
  // Sort by due date
  const sorted = [...milestones].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  
  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-white/10" />
      
      {sorted.map((milestone, index) => {
        const statusConfig = getStatusConfig(milestone.status);
        const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && milestone.status !== 'completed';
        
        return (
          <div 
            key={milestone.id || milestone._id} 
            className="relative pb-8 last:pb-0"
          >
            {/* Timeline dot */}
            <div className={`
              absolute left-[-20px] w-6 h-6 rounded-full border-2 flex items-center justify-center
              ${milestone.status === 'completed' 
                ? 'bg-success border-success' 
                : isOverdue 
                  ? 'bg-error-500 border-error-500'
                  : 'bg-white dark:bg-[#1f1f23] border-slate-300 dark:border-white/20'
              }
            `}>
              {milestone.status === 'completed' && (
                <CheckCircle2 className="w-3 h-3 text-white" />
              )}
            </div>
            
            {/* Content */}
            <div 
              className="
                p-4 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
                hover:shadow-sm dark:hover:bg-[#27272a] hover:border-slate-300 dark:hover:border-white/20
                transition-all duration-200 cursor-pointer
              "
              onClick={() => onMilestoneClick?.(milestone)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium
                  ${statusConfig.bg} ${statusConfig.color}
                `}>
                  {statusConfig.label}
                </span>
                {milestone.dueDate && (
                  <span className={`text-xs ${isOverdue ? 'text-error-500' : 'text-slate-500 dark:text-zinc-400'}`}>
                    {new Date(milestone.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {milestone.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
                <span>{milestone.completedTasks}/{milestone.totalTasks} tasks</span>
                <span>{milestone.progress}% complete</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
const RoadmapView = ({
  projectId,
  milestones: propMilestones,
  isLoading: propIsLoading,
  error: propError,
  onMilestoneClick,
  onCreateMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onAddMilestone,
  onRefresh: propOnRefresh,
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const [fetchedMilestones, setFetchedMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const shouldFetch = projectId && (!propMilestones || propMilestones.length === 0);
  
  const loadMilestones = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true); setError(null);
    try {
      const data = await fetchMilestones(projectId);
      setFetchedMilestones(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
  
  useEffect(() => {
    if (shouldFetch) loadMilestones();
  }, [shouldFetch, loadMilestones]);
  
  const handleRefresh = useCallback(() => {
    if (propOnRefresh) propOnRefresh();
    if (shouldFetch) loadMilestones();
  }, [propOnRefresh, shouldFetch, loadMilestones]);
  
  const rawMilestones = propMilestones?.length > 0 ? propMilestones : fetchedMilestones;
  const loading = propIsLoading ?? isLoading;
  const err = propError ?? error;

  const normalizedMilestones = useMemo(() => {
    return rawMilestones.map(normalizeMilestone).filter(Boolean);
  }, [rawMilestones]);

  const filteredMilestones = useMemo(() => {
    if (statusFilter === 'all') return normalizedMilestones;
    const filterValue = statusFilter.replace('-', '_');
    return normalizedMilestones.filter((m) => {
      const milestoneStatus = m.status?.replace('-', '_');
      return milestoneStatus === filterValue;
    });
  }, [normalizedMilestones, statusFilter]);

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

  const createHandler = onCreateMilestone || onAddMilestone;

  const renderContent = () => {
    if (loading) {
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

    if (err) return <ErrorState error={err} onRetry={handleRefresh} />;
    if (!filteredMilestones.length) return <EmptyState onCreateMilestone={createHandler} />;

    switch (viewMode) {
      case 'timeline':
        return <MilestoneTimeline milestones={filteredMilestones} onMilestoneClick={onMilestoneClick} />;
      case 'list':
        return (
          <div className="space-y-3">
            {filteredMilestones.map((milestone) => (
              <MilestoneRow key={milestone._id || milestone.id} milestone={milestone} onClick={onMilestoneClick} />
            ))}
          </div>
        );
      case 'grid':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMilestones.map((milestone) => (
              <MilestoneCard key={milestone._id || milestone.id} milestone={milestone} onClick={onMilestoneClick} onEdit={onEditMilestone} onDelete={onDeleteMilestone} />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Roadmap</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Track project milestones and deliverables
          </p>
        </div>
        
        {handleRefresh && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      {/* Stats Bar */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-brand" />
          <span className="text-sm font-medium text-slate-900 dark:text-white">{stats.total}</span>
          <span className="text-xs text-slate-500 dark:text-zinc-400">Total</span>
        </div>
        <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
        <div className="flex items-center gap-4 text-xs font-medium">
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
              bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 text-sm font-medium
              text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#27272a]
              transition-all duration-200 shadow-sm dark:shadow-none
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
                bg-white dark:bg-[#27272a] border border-slate-200 dark:border-white/10
                shadow-lg dark:shadow-black/40
              ">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setStatusFilter(filter.value);
                      setShowFilterMenu(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-sm text-left font-medium
                      ${statusFilter === filter.value
                        ? 'text-brand bg-brand/10'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10'
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
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1f1f23] rounded-lg border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
            {Object.entries(VIEW_MODES).map(([mode, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`
                    p-2 rounded-md transition-all
                    ${viewMode === mode
                      ? 'bg-slate-100 dark:bg-[#27272a] text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/5'
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
          {createHandler && (
            <button
              onClick={createHandler}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-brand text-white text-sm font-medium
                hover:bg-brand-600 hover:shadow-md
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
