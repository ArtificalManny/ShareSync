// src/components/roadmap/MilestoneRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Milestone Row - List view display
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

/* ─────────────────────────────────────────────────────────────────────────
   STATUS CONFIGURATION
───────────────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  planned: {
    label: 'Planned',
    color: 'text-text-tertiary',
    bgColor: 'bg-surface-2',
    icon: Circle,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-brand',
    bgColor: 'bg-brand/10',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: CheckCircle2,
  },
  overdue: {
    label: 'Overdue',
    color: 'text-error-500',
    bgColor: 'bg-error-500/10',
    icon: AlertTriangle,
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────── */
const MilestoneRow = ({
  milestone,
  onClick,
  isDraggable = false,
  dragHandleProps = {},
  isSelected = false,
}) => {
  // Extract fields with fallbacks
  const id = getMilestoneId(milestone);
  const title = milestone?.title || milestone?.name || 'Untitled Milestone';
  const status = milestone?.status || 'planned';
  const dueDate = milestone?.dueDate || milestone?.targetDate || milestone?.endDate;
  const completedTasks = milestone?.completedTasks || milestone?.tasksCompleted || 0;
  const totalTasks = milestone?.totalTasks || milestone?.taskCount || 0;
  const progress = getProgressPercentage(completedTasks, totalTasks);

  // Status config
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
        bg-surface-1 border transition-all duration-200
        ${isSelected
          ? 'border-brand/50 bg-brand/5'
          : 'border-white/[0.06] hover:bg-surface-2 hover:border-white/[0.1]'
        }
      `}
    >
      {/* Drag Handle */}
      {isDraggable && (
        <div
          {...dragHandleProps}
          className="
            p-1 rounded cursor-grab active:cursor-grabbing
            text-text-tertiary hover:text-text-secondary
            opacity-0 group-hover:opacity-100 transition-opacity
          "
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Status Badge */}
      <div className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
        ${statusConfig.bgColor} ${statusConfig.color}
        min-w-[100px] justify-center
      `}>
        <StatusIcon className="w-3.5 h-3.5" />
        <span>{statusConfig.label}</span>
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors truncate">
          {title}
        </h3>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 min-w-[140px]">
        <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`
              h-full rounded-full transition-all duration-500
              ${progress >= 100 ? 'bg-success' : 'bg-brand'}
            `}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className={`text-xs font-medium w-10 text-right ${progress >= 100 ? 'text-success' : 'text-text-primary'}`}>
          {progress}%
        </span>
      </div>

      {/* Task Count */}
      <div className="flex items-center gap-1.5 text-text-tertiary min-w-[80px]">
        <Flag className="w-3.5 h-3.5" />
        <span className="text-xs">
          {completedTasks}/{totalTasks}
        </span>
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-1.5 text-text-tertiary min-w-[80px]">
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-xs">{formatDate(dueDate)}</span>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default MilestoneRow;
