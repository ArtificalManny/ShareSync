// src/components/roadmap/MilestoneCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Individual Milestone Card - Grid view display
//
// ✅ SAFE:
// - Prefers computed fields injected by RoadmapPanel: progress, tasksDone, tasksTotal, tasksLeft
// - Falls back to backend-ish fields if present
// - No backend assumptions required
//
// ✅ ADDED: onStatusChange prop — status quick-actions in "..." dropdown
//
// ⭐ LIGHT MODE CONTRAST FIX:
// - Explicit light-mode backgrounds and text colors
// - Preserves dark-mode token behavior
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Flag,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Edit2,
  Trash2,
  ChevronRight,
} from 'lucide-react';

const STATUS_CONFIG = {
  planned: {
    label: 'Planned',
    color: 'text-slate-600 dark:text-text-tertiary',
    bgColor: 'bg-slate-100 dark:bg-surface-2',
    borderColor: 'border-slate-200 dark:border-white/[0.06]',
    icon: Circle,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-violet-700 dark:text-brand',
    bgColor: 'bg-violet-50 dark:bg-brand/10',
    borderColor: 'border-violet-200 dark:border-brand/20',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-violet-700 dark:text-brand',
    bgColor: 'bg-violet-50 dark:bg-brand/10',
    borderColor: 'border-violet-200 dark:border-brand/20',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-700 dark:text-success',
    bgColor: 'bg-emerald-50 dark:bg-success/10',
    borderColor: 'border-emerald-200 dark:border-success/20',
    icon: CheckCircle2,
  },
  at_risk: {
    label: 'At Risk',
    color: 'text-red-700 dark:text-error-500',
    bgColor: 'bg-red-50 dark:bg-error-500/10',
    borderColor: 'border-red-200 dark:border-error-500/20',
    icon: AlertTriangle,
  },
  overdue: {
    label: 'Overdue',
    color: 'text-red-700 dark:text-error-500',
    bgColor: 'bg-red-50 dark:bg-error-500/10',
    borderColor: 'border-red-200 dark:border-error-500/20',
    icon: AlertTriangle,
  },
};

const ALL_STATUS_TRANSITIONS = [
  { value: 'planned', label: 'Mark Planned', icon: Circle, color: 'text-slate-600 dark:text-text-tertiary' },
  { value: 'in_progress', label: 'Mark In Progress', icon: Clock, color: 'text-violet-700 dark:text-brand' },
  { value: 'completed', label: 'Mark Completed', icon: CheckCircle2, color: 'text-emerald-700 dark:text-success' },
  { value: 'at_risk', label: 'Mark At Risk', icon: AlertTriangle, color: 'text-red-700 dark:text-error-500' },
];

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getMilestoneId = (milestone) => milestone?._id || milestone?.id;

const normalizeStatus = (s) => (s || '').toLowerCase().trim();

const normalizeToCardStatus = (rawStatus, dueDate) => {
  const s = normalizeStatus(rawStatus);

  if (s === 'done' || s === 'complete' || s === 'completed') return 'completed';
  if (s === 'inprogress' || s === 'in-progress' || s === 'in_progress' || s === 'active') return 'in-progress';
  if (s === 'at_risk' || s === 'at-risk') return 'at_risk';

  const d = dueDate ? new Date(dueDate) : null;
  const overdue =
    d && !Number.isNaN(d.getTime()) && d.getTime() < Date.now() && s !== 'completed' && s !== 'done' && s !== 'complete';

  if (overdue) return 'overdue';
  return 'planned';
};

const normalizeToApiStatus = (cardStatus) => {
  if (cardStatus === 'in-progress') return 'in_progress';
  if (cardStatus === 'overdue') return 'at_risk';
  return cardStatus;
};

const clampPercent = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
};

const MilestoneCard = ({
  milestone,
  onClick,
  onEdit,
  onDelete,
  isSelected = false,
  showActions = true,
  onStatusChange,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const id = getMilestoneId(milestone);

  const title = milestone?.title || milestone?.name || 'Untitled Milestone';
  const description = milestone?.description || '';

  const dueDate = milestone?.dueDate || milestone?.targetDate || milestone?.endDate;

  const completedTasks =
    milestone?.tasksDone ??
    milestone?.completedTasks ??
    milestone?.tasksCompleted ??
    0;

  const totalTasks =
    milestone?.tasksTotal ??
    milestone?.totalTasks ??
    milestone?.taskCount ??
    0;

  const computedProgress = useMemo(() => {
    if (milestone?.progress !== undefined && milestone?.progress !== null) {
      return clampPercent(milestone.progress);
    }
    const total = Number(totalTasks) || 0;
    const done = Number(completedTasks) || 0;
    if (total <= 0) return 0;
    return clampPercent((done / total) * 100);
  }, [milestone?.progress, totalTasks, completedTasks]);

  const statusRaw = milestone?.status || 'planned';
  const status = normalizeToCardStatus(statusRaw, dueDate);

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.planned;
  const StatusIcon = statusConfig.icon;

  const currentApiStatus = normalizeToApiStatus(status);
  const availableTransitions = useMemo(() => {
    return ALL_STATUS_TRANSITIONS.filter((t) => t.value !== currentApiStatus);
  }, [currentApiStatus]);

  const handleClick = () => {
    if (onClick && id) onClick(id, milestone);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onEdit && id) onEdit(id, milestone);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete && id) onDelete(id, milestone);
  };

  const handleStatusChange = (e, newStatus) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onStatusChange && id) onStatusChange(id, newStatus);
  };

  const dueLabel = formatDate(dueDate);

  return (
    <div
      onClick={handleClick}
      className={`roadmap-milestone-card 
        group relative p-5 rounded-xl cursor-pointer
        bg-white dark:bg-surface-1 border transition-all duration-200
        ${isSelected
          ? 'border-violet-300 bg-violet-50/50 dark:border-brand/50 dark:bg-brand/5'
          : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:border-white/[0.06] dark:hover:bg-surface-2 dark:hover:border-white/[0.1]'
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`
          flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border
          ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}
        `}>
          <StatusIcon className="w-3 h-3" />
          <span>{statusConfig.label}</span>
        </div>

        {showActions && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="
                p-1.5 rounded-md opacity-0 group-hover:opacity-100
                text-slate-500 dark:text-text-tertiary
                hover:text-slate-900 dark:hover:text-text-primary
                hover:bg-slate-100 dark:hover:bg-surface-3
                transition-all duration-200
              "
              aria-label="Milestone actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="
                  absolute right-0 top-full mt-1 z-20
                  w-48 py-1 rounded-lg
                  bg-white dark:bg-surface-2
                  border border-slate-200 dark:border-white/[0.08]
                  shadow-lg shadow-slate-900/10 dark:shadow-black/20
                ">
                  <button
                    onClick={handleEdit}
                    className="
                      w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                      text-slate-700 dark:text-text-secondary
                      hover:text-slate-900 dark:hover:text-text-primary
                      hover:bg-slate-50 dark:hover:bg-surface-3
                      transition-colors
                    "
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  {onStatusChange && availableTransitions.length > 0 ? (
                    <>
                      <div className="my-1 border-t border-slate-200 dark:border-white/[0.06]" />
                      <div className="px-3 py-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-text-tertiary">
                          Change Status
                        </span>
                      </div>
                      {availableTransitions.map((transition) => {
                        const TransIcon = transition.icon;
                        return (
                          <button
                            key={transition.value}
                            onClick={(e) => handleStatusChange(e, transition.value)}
                            className={`
                              w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                              ${transition.color} hover:bg-slate-50 dark:hover:bg-surface-3
                              transition-colors
                            `}
                          >
                            <TransIcon className="w-3.5 h-3.5" />
                            {transition.label}
                          </button>
                        );
                      })}
                    </>
                  ) : null}

                  {onDelete ? (
                    <>
                      <div className="my-1 border-t border-slate-200 dark:border-white/[0.06]" />
                      <button
                        onClick={handleDelete}
                        className="
                          w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                          text-red-600 dark:text-error-500 hover:bg-red-50 dark:hover:bg-error-500/10
                          transition-colors
                        "
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-text-primary mb-2 group-hover:text-violet-700 dark:group-hover:text-brand transition-colors line-clamp-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-600 dark:text-text-secondary line-clamp-2 mb-4">
          {description}
        </p>
      )}

      {dueLabel && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-text-tertiary mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span>Due {dueLabel}</span>
        </div>
      )}

      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-slate-500 dark:text-text-tertiary uppercase tracking-wider">
            Progress
          </span>
          <span className={`text-xs font-medium ${computedProgress >= 100 ? 'text-emerald-600 dark:text-success' : 'text-slate-900 dark:text-text-primary'}`}>
            {computedProgress}%
          </span>
        </div>

        <div className="h-1.5 bg-slate-200 dark:bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`
              h-full rounded-full transition-all duration-500
              ${computedProgress >= 100 ? 'bg-emerald-500 dark:bg-success' : computedProgress >= 50 ? 'bg-violet-500 dark:bg-brand' : 'bg-violet-600 dark:bg-brand-700'}
            `}
            style={{ width: `${Math.min(computedProgress, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-text-tertiary">
          <Flag className="w-3.5 h-3.5" />
          <span className="text-xs">
            {Number(completedTasks) || 0}/{Number(totalTasks) || 0} tasks
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

export default MilestoneCard;
