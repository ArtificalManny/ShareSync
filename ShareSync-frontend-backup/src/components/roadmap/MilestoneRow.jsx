// src/components/roadmap/MilestoneRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Milestone Row - List view display
//
// ⭐ LIGHT MODE CONTRAST FIX:
// - Explicit light-mode colors for title, metadata, progress, and container
// - Preserves dark-mode token behavior
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import {
  Flag,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronRight,
  GripVertical,
} from 'lucide-react';

const STATUS_CONFIG = {
  planned: {
    label: 'Planned',
    color: 'text-slate-600 dark:text-text-tertiary',
    bgColor: 'bg-slate-100 dark:bg-surface-2',
    icon: Circle,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-violet-700 dark:text-brand',
    bgColor: 'bg-violet-50 dark:bg-brand/10',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-700 dark:text-success',
    bgColor: 'bg-emerald-50 dark:bg-success/10',
    icon: CheckCircle2,
  },
  overdue: {
    label: 'Overdue',
    color: 'text-red-700 dark:text-error-500',
    bgColor: 'bg-red-50 dark:bg-error-500/10',
    icon: AlertTriangle,
  },
};

const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getProgressPercentage = (completed, total) => {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
};

const getMilestoneId = (milestone) => milestone?._id || milestone?.id;

const MilestoneRow = ({
  milestone,
  onClick,
  isDraggable = false,
  dragHandleProps = {},
  isSelected = false,
}) => {
  const id = getMilestoneId(milestone);
  const title = milestone?.title || milestone?.name || 'Untitled Milestone';
  const status = milestone?.status || 'planned';
  const dueDate = milestone?.dueDate || milestone?.targetDate || milestone?.endDate;
  const completedTasks = milestone?.completedTasks || milestone?.tasksCompleted || 0;
  const totalTasks = milestone?.totalTasks || milestone?.taskCount || 0;
  const progress = getProgressPercentage(completedTasks, totalTasks);

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.planned;
  const StatusIcon = statusConfig.icon;

  const handleClick = () => {
    if (onClick && id) {
      onClick(id, milestone);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group flex items-center gap-4 p-4 rounded-xl cursor-pointer
        bg-white dark:bg-surface-1 border transition-all duration-200
        ${isSelected
          ? 'border-violet-300 bg-violet-50/50 dark:border-brand/50 dark:bg-brand/5'
          : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:border-white/[0.06] dark:hover:bg-surface-2 dark:hover:border-white/[0.1]'
        }
      `}
    >
      {isDraggable && (
        <div
          {...dragHandleProps}
          className="
            p-1 rounded cursor-grab active:cursor-grabbing
            text-slate-400 dark:text-text-tertiary hover:text-slate-600 dark:hover:text-text-secondary
            opacity-0 group-hover:opacity-100 transition-opacity
          "
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      <div className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
        ${statusConfig.bgColor} ${statusConfig.color}
        min-w-[100px] justify-center
      `}>
        <StatusIcon className="w-3.5 h-3.5" />
        <span>{statusConfig.label}</span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-slate-900 dark:text-text-primary group-hover:text-violet-700 dark:group-hover:text-brand transition-colors truncate">
          {title}
        </h3>
      </div>

      <div className="flex items-center gap-3 min-w-[140px]">
        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`
              h-full rounded-full transition-all duration-500
              ${progress >= 100 ? 'bg-emerald-500 dark:bg-success' : 'bg-violet-500 dark:bg-brand'}
            `}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className={`text-xs font-medium w-10 text-right ${progress >= 100 ? 'text-emerald-600 dark:text-success' : 'text-slate-900 dark:text-text-primary'}`}>
          {progress}%
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-slate-500 dark:text-text-tertiary min-w-[80px]">
        <Flag className="w-3.5 h-3.5" />
        <span className="text-xs">
          {completedTasks}/{totalTasks}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-slate-500 dark:text-text-tertiary min-w-[80px]">
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-xs">{formatDate(dueDate)}</span>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default MilestoneRow;
