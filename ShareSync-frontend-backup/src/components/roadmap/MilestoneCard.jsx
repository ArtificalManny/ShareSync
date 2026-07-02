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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Plus,
  X,
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

const parseDateOnlyLocal = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (date) => {
  if (!date) return null;
  const d = parseDateOnlyLocal(date);
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

  const d = parseDateOnlyLocal(dueDate);
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
  onUpdate,
}) => {
  const [newCheckpointTitle, setNewCheckpointTitle] = useState("");

  const [showMenu, setShowMenu] = useState(false);
  const actionButtonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleToggleMenu = useCallback((e) => {
    e.stopPropagation();

    const rect = actionButtonRef.current?.getBoundingClientRect?.();

    if (rect) {
      const menuWidth = 260;
      const menuHeight = 310;
      const gap = 10;

      const left = Math.max(
        12,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12)
      );

      const topBelow = rect.bottom + gap;
      const top =
        topBelow + menuHeight > window.innerHeight
          ? Math.max(12, rect.top - menuHeight - gap)
          : topBelow;

      setMenuPosition({ top, left });
    }

    setShowMenu((open) => !open);
  }, []);

  useEffect(() => {
    if (!showMenu) return undefined;

    const close = () => setShowMenu(false);

    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);

  const checkpoints = useMemo(
    () => (Array.isArray(milestone?.checkpoints) ? milestone.checkpoints : []),
    [milestone?.checkpoints]
  );
  const completedCheckpoints = checkpoints.filter((checkpoint) => checkpoint?.completed).length;
  const checkpointSummary = checkpoints.length
    ? `${completedCheckpoints}/${checkpoints.length} checkpoints`
    : "No checkpoints yet";

  const persistCheckpoints = useCallback(
    (nextCheckpoints) => {
      if (!onUpdate || !id) return;
      onUpdate(id, { checkpoints: nextCheckpoints });
    },
    [id, onUpdate]
  );

  const handleAddCheckpoint = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const title = newCheckpointTitle.trim();
    if (!title) return;

    persistCheckpoints([
      ...checkpoints,
      {
        id: `checkpoint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    setNewCheckpointTitle("");
  };

  const handleToggleCheckpoint = (e, checkpointId) => {
    e.stopPropagation();

    persistCheckpoints(
      checkpoints.map((checkpoint) => {
        if (checkpoint.id !== checkpointId) return checkpoint;
        const completed = !checkpoint.completed;
        return {
          ...checkpoint,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      })
    );
  };

  const handleDeleteCheckpoint = (e, checkpointId) => {
    e.stopPropagation();
    persistCheckpoints(checkpoints.filter((checkpoint) => checkpoint.id !== checkpointId));
  };


    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [showMenu]);


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

        <div
          className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/[0.08] dark:bg-white/[0.03]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-text-tertiary">
              Checkpoints
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-tertiary">
              {checkpointSummary}
            </span>
          </div>

          {checkpoints.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {checkpoints.slice(0, 4).map((checkpoint) => (
                <div
                  key={checkpoint.id}
                  className="flex items-center gap-2 rounded-xl bg-white/80 px-2.5 py-2 text-xs text-slate-700 dark:bg-surface-2/70 dark:text-text-secondary"
                >
                  <button
                    type="button"
                    onClick={(e) => handleToggleCheckpoint(e, checkpoint.id)}
                    className="shrink-0 text-violet-600 dark:text-brand"
                  >
                    {checkpoint.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <span className={`min-w-0 flex-1 truncate ${checkpoint.completed ? "text-slate-400 line-through dark:text-text-tertiary" : ""}`}>
                    {checkpoint.title}
                  </span>

                  {onUpdate && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCheckpoint(e, checkpoint.id)}
                      className="shrink-0 text-slate-400 hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {onUpdate && (
            <form onSubmit={handleAddCheckpoint} className="flex items-center gap-2">
              <input
                value={newCheckpointTitle}
                onChange={(e) => setNewCheckpointTitle(e.target.value)}
                placeholder="Add checkpoint..."
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-200/60 dark:border-white/[0.08] dark:bg-surface-2 dark:text-text-primary"
              />
              <button
                type="submit"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>


        {showActions && (
        <div
          className="
            roadmap-milestone-action-tray
            mt-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08]
            bg-slate-50/80 dark:bg-white/[0.03]
            p-2 shadow-inner shadow-white/70 dark:shadow-none
          "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="
                inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5
                text-xs font-semibold
                bg-white dark:bg-surface-2
                text-violet-700 dark:text-brand
                border border-violet-100 dark:border-brand/20
                hover:bg-violet-50 dark:hover:bg-brand/10
                transition-colors
              "
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>

            {onStatusChange && currentApiStatus !== 'completed' ? (
              <button
                type="button"
                onClick={(e) => handleStatusChange(e, 'completed')}
                className="
                  inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5
                  text-xs font-semibold
                  bg-emerald-50 dark:bg-success/10
                  text-emerald-700 dark:text-success
                  border border-emerald-200 dark:border-success/20
                  hover:bg-emerald-100 dark:hover:bg-success/15
                  transition-colors
                "
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Completed
              </button>
            ) : onStatusChange ? (
              <button
                type="button"
                onClick={(e) => handleStatusChange(e, 'in_progress')}
                className="
                  inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5
                  text-xs font-semibold
                  bg-violet-50 dark:bg-brand/10
                  text-violet-700 dark:text-brand
                  border border-violet-200 dark:border-brand/20
                  hover:bg-violet-100 dark:hover:bg-brand/15
                  transition-colors
                "
              >
                <Clock className="w-3.5 h-3.5" />
                Mark In Progress
              </button>
            ) : null}

            {onStatusChange && currentApiStatus !== 'planned' ? (
              <button
                type="button"
                onClick={(e) => handleStatusChange(e, 'planned')}
                className="
                  inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5
                  text-xs font-semibold
                  bg-white dark:bg-surface-2
                  text-slate-700 dark:text-text-secondary
                  border border-slate-200 dark:border-white/[0.08]
                  hover:bg-slate-100 dark:hover:bg-surface-3
                  transition-colors
                "
              >
                <Circle className="w-3.5 h-3.5" />
                Plan
              </button>
            ) : onStatusChange ? (
              <button
                type="button"
                onClick={(e) => handleStatusChange(e, 'in_progress')}
                className="
                  inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5
                  text-xs font-semibold
                  bg-violet-50 dark:bg-brand/10
                  text-violet-700 dark:text-brand
                  border border-violet-200 dark:border-brand/20
                  hover:bg-violet-100 dark:hover:bg-brand/15
                  transition-colors
                "
              >
                <Clock className="w-3.5 h-3.5" />
                Start
              </button>
            ) : null}

            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="
                  inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5
                  text-xs font-semibold
                  bg-red-50 dark:bg-error-500/10
                  text-red-700 dark:text-error-500
                  border border-red-200 dark:border-error-500/20
                  hover:bg-red-100 dark:hover:bg-error-500/15
                  transition-colors
                "
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-200 dark:border-white/[0.06]">
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
