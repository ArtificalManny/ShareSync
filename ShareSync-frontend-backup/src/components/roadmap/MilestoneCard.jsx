// src/components/roadmap/MilestoneCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Individual Milestone Card - Grid view display
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
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

/* ─────────────────────────────────────────────────────────────────────────
   STATUS CONFIGURATION
───────────────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  planned: {
    label: 'Planned',
    color: 'text-text-tertiary',
    bgColor: 'bg-surface-2',
    borderColor: 'border-white/[0.06]',
    icon: Circle,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-brand',
    bgColor: 'bg-brand/10',
    borderColor: 'border-brand/20',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
    icon: CheckCircle2,
  },
  overdue: {
    label: 'Overdue',
    color: 'text-error-500',
    bgColor: 'bg-error-500/10',
    borderColor: 'border-error-500/20',
    icon: AlertTriangle,
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────────────────── */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getProgressPercentage = (completed, total) => {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
};

const getMilestoneId = (milestone) => milestone?._id || milestone?.id;

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────── */
const MilestoneCard = ({
  milestone,
  onClick,
  onEdit,
  onDelete,
  isSelected = false,
  showActions = true,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Extract fields with fallbacks
  const id = getMilestoneId(milestone);
  const title = milestone?.title || milestone?.name || 'Untitled Milestone';
  const description = milestone?.description || '';
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

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onEdit && id) {
      onEdit(id, milestone);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete && id) {
      onDelete(id, milestone);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative p-5 rounded-xl cursor-pointer
        bg-surface-1 border transition-all duration-200
        ${isSelected
          ? 'border-brand/50 bg-brand/5'
          : 'border-white/[0.06] hover:bg-surface-2 hover:border-white/[0.1]'
        }
      `}
    >
      {/* Header: Status + Actions */}
      <div className="flex items-start justify-between mb-4">
        <div className={`
          flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
          ${statusConfig.bgColor} ${statusConfig.color}
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
                text-text-tertiary hover:text-text-primary hover:bg-surface-3
                transition-all duration-200
              "
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
                  w-36 py-1 rounded-lg
                  bg-surface-2 border border-white/[0.08]
                  shadow-lg shadow-black/20
                ">
                  <button
                    onClick={handleEdit}
                    className="
                      w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                      text-text-secondary hover:text-text-primary hover:bg-surface-3
                      transition-colors
                    "
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="
                      w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                      text-error-500 hover:bg-error-500/10
                      transition-colors
                    "
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-text-primary mb-2 group-hover:text-brand transition-colors line-clamp-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-text-secondary line-clamp-2 mb-4">
          {description}
        </p>
      )}

      {/* Due Date */}
      {dueDate && (
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span>Due {formatDate(dueDate)}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
            Progress
          </span>
          <span className={`text-xs font-medium ${progress >= 100 ? 'text-success' : 'text-text-primary'}`}>
            {progress}%
          </span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`
              h-full rounded-full transition-all duration-500
              ${progress >= 100 ? 'bg-success' : progress >= 50 ? 'bg-brand' : 'bg-brand-700'}
            `}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer: Task Count */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <Flag className="w-3.5 h-3.5" />
          <span className="text-xs">
            {completedTasks}/{totalTasks} tasks
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

export default MilestoneCard;
