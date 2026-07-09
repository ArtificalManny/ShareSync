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
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Edit2,
  Trash2,
  Plus,
  X,
} from 'lucide-react';

const STATUS_CONFIG = {
  planned: {
    label: 'Planned',
    color: 'text-slate-600 dark:text-zinc-200',
    bgColor: 'bg-slate-100 dark:bg-white/[0.10]',
    borderColor: 'border-slate-200 dark:border-white/[0.16]',
    icon: Circle,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-violet-700 dark:text-violet-100',
    bgColor: 'bg-violet-50 dark:bg-violet-500/20',
    borderColor: 'border-violet-200 dark:border-violet-300/30',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-violet-700 dark:text-violet-100',
    bgColor: 'bg-violet-50 dark:bg-violet-500/20',
    borderColor: 'border-violet-200 dark:border-violet-300/30',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-700 dark:text-emerald-100',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-200 dark:border-emerald-300/30',
    icon: CheckCircle2,
  },
  at_risk: {
    label: 'At Risk',
    color: 'text-red-700 dark:text-red-100',
    bgColor: 'bg-red-50 dark:bg-red-500/20',
    borderColor: 'border-red-200 dark:border-red-300/30',
    icon: AlertTriangle,
  },
  overdue: {
    label: 'Overdue',
    color: 'text-red-700 dark:text-red-100',
    bgColor: 'bg-red-50 dark:bg-red-500/20',
    borderColor: 'border-red-200 dark:border-red-300/30',
    icon: AlertTriangle,
  },
};

const ALL_STATUS_TRANSITIONS = [
  { value: 'planned', label: 'Mark Planned', icon: Circle, color: 'text-slate-600 dark:text-zinc-200' },
  { value: 'in_progress', label: 'Mark In Progress', icon: Clock, color: 'text-violet-700 dark:text-violet-100' },
  { value: 'completed', label: 'Mark Completed', icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-100' },
  { value: 'at_risk', label: 'Mark At Risk', icon: AlertTriangle, color: 'text-red-700 dark:text-red-100' },
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


    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [showMenu]);


  const id = getMilestoneId(milestone);

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


  const title = milestone?.title || milestone?.name || 'Untitled Milestone';
  const description = milestone?.description || '';

  const dueDate = milestone?.dueDate || milestone?.targetDate || milestone?.endDate;


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
        group relative overflow-hidden p-5 rounded-[1.5rem] cursor-pointer
        border bg-white text-slate-900 shadow-sm transition-all duration-200
        dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white dark:shadow-none
        ${isSelected
          ? 'border-violet-300 bg-violet-50/70 ring-2 ring-violet-200/70 dark:border-violet-300/45 dark:bg-violet-500/10 dark:ring-violet-400/15'
          : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:border-white/[0.10] dark:hover:bg-white/[0.05] dark:hover:border-violet-300/30'
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

      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-violet-700 dark:group-hover:text-violet-200 transition-colors line-clamp-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-600 dark:text-zinc-300 line-clamp-2 mb-4">
          {description}
        </p>
      )}

      {dueLabel && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span>Due {dueLabel}</span>
        </div>
      )}

        <div
          className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 shadow-sm shadow-violet-100/40 dark:border-white/[0.12] dark:bg-slate-950/55 dark:shadow-inner dark:shadow-black/20" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Checkpoints
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              {checkpointSummary}
            </span>
          </div>

          {checkpoints.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {checkpoints.slice(0, 4).map((checkpoint) => (
                <div
                  key={checkpoint.id}
                  className="flex items-center gap-2 rounded-xl bg-white/85 px-2.5 py-2 text-xs text-slate-700 dark:bg-white/[0.08] dark:text-zinc-200"
                >
                  <button
                    type="button"
                    onClick={(e) => handleToggleCheckpoint(e, checkpoint.id)}
                    className="shrink-0 text-violet-600 dark:text-violet-100"
                  >
                    {checkpoint.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <span className={`min-w-0 flex-1 truncate ${checkpoint.completed ? "text-slate-400 line-through dark:text-zinc-500" : ""}`}>
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
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-200/60 dark:border-white/[0.14] dark:bg-slate-950/75 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-violet-300/40 dark:focus:ring-violet-400/15"
              />
              <button
                type="submit"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 transition hover:-translate-y-0.5 hover:shadow-violet-500/40" 
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
            bg-slate-50/80 dark:bg-slate-950/65
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
                bg-white dark:bg-white/[0.08]
                text-violet-700 dark:text-violet-100
                border border-violet-100 dark:border-violet-300/30
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
                  bg-emerald-50 dark:bg-emerald-500/20
                  text-emerald-700 dark:text-emerald-100
                  border border-emerald-200 dark:border-emerald-300/30
                  hover:bg-emerald-100 dark:hover:bg-emerald-500/25
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
                  bg-violet-50 dark:bg-violet-500/20
                  text-violet-700 dark:text-violet-100
                  border border-violet-200 dark:border-violet-300/30
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
                  bg-white dark:bg-white/[0.08]
                  text-slate-700 dark:text-zinc-300
                  border border-slate-200 dark:border-white/[0.08]
                  hover:bg-slate-100 dark:hover:bg-white/[0.12]
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
                  bg-violet-50 dark:bg-violet-500/20
                  text-violet-700 dark:text-violet-100
                  border border-violet-200 dark:border-violet-300/30
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
                  bg-red-50 dark:bg-red-500/20
                  text-red-700 dark:text-red-100
                  border border-red-200 dark:border-red-300/30
                  hover:bg-red-100 dark:hover:bg-red-500/25
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

    </div>
  );
};

export default MilestoneCard;
