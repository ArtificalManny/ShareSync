// src/components/roadmap/MilestoneTimeline.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Milestone Timeline - Horizontal timeline visualization
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import {
  Flag,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   STATUS CONFIGURATION
───────────────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  planned: {
    color: 'text-text-tertiary',
    bgColor: 'bg-surface-3',
    ringColor: 'ring-white/10',
    lineColor: 'bg-white/10',
    icon: Circle,
  },
  'in-progress': {
    color: 'text-brand',
    bgColor: 'bg-brand',
    ringColor: 'ring-brand/30',
    lineColor: 'bg-brand/30',
    icon: Clock,
  },
  completed: {
    color: 'text-success',
    bgColor: 'bg-success',
    ringColor: 'ring-success/30',
    lineColor: 'bg-success/30',
    icon: CheckCircle2,
  },
  overdue: {
    color: 'text-error-500',
    bgColor: 'bg-error-500',
    ringColor: 'ring-error-500/30',
    lineColor: 'bg-error-500/30',
    icon: AlertTriangle,
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────────────────── */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getMilestoneId = (milestone) => milestone?._id || milestone?.id;

/* ─────────────────────────────────────────────────────────────────────────
   TIMELINE NODE
───────────────────────────────────────────────────────────────────────── */
const TimelineNode = ({ milestone, isFirst, isLast, onClick }) => {
  const id = getMilestoneId(milestone);
  const title = milestone?.title || milestone?.name || 'Untitled Milestone';
  const status = milestone?.status || 'planned';
  const dueDate = milestone?.dueDate || milestone?.targetDate;
  const completedTasks = milestone?.completedTasks || 0;
  const totalTasks = milestone?.totalTasks || 0;

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.planned;
  const StatusIcon = statusConfig.icon;

  const handleClick = () => {
    if (onClick && id) {
      onClick(id, milestone);
    }
  };

  return (
    <div className="flex flex-col items-center relative group">
      {/* Connector Line (before) */}
      {!isFirst && (
        <div className={`
          absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2
          ${statusConfig.lineColor}
        `} />
      )}

      {/* Connector Line (after) */}
      {!isLast && (
        <div className={`
          absolute left-1/2 top-5 h-0.5 w-full -translate-y-1/2
          bg-white/10
        `} />
      )}

      {/* Node */}
      <button
        onClick={handleClick}
        className={`
          relative z-10 w-10 h-10 rounded-full flex items-center justify-center
          ${statusConfig.bgColor} ring-4 ${statusConfig.ringColor}
          transition-all duration-200 hover:scale-110
        `}
      >
        <StatusIcon className="w-5 h-5 text-white" />
      </button>

      {/* Content */}
      <div
        onClick={handleClick}
        className="
          mt-4 p-3 rounded-lg bg-surface-1 border border-white/[0.06]
          hover:bg-surface-2 hover:border-white/[0.1]
          transition-all duration-200 cursor-pointer
          min-w-[140px] max-w-[180px] text-center
        "
      >
        <h4 className="text-sm font-medium text-text-primary mb-1 line-clamp-2 group-hover:text-brand transition-colors">
          {title}
        </h4>
        {dueDate && (
          <p className="text-xs text-text-tertiary mb-2">
            {formatDate(dueDate)}
          </p>
        )}
        <div className="flex items-center justify-center gap-1 text-text-tertiary">
          <Flag className="w-3 h-3" />
          <span className="text-[10px]">
            {completedTasks}/{totalTasks} tasks
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────── */
const MilestoneTimeline = ({ milestones = [], onMilestoneClick }) => {
  // Sort milestones by due date
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => {
      const dateA = new Date(a.dueDate || a.targetDate || 0);
      const dateB = new Date(b.dueDate || b.targetDate || 0);
      return dateA - dateB;
    });
  }, [milestones]);

  if (!sortedMilestones.length) {
    return (
      <div className="flex items-center justify-center py-16 text-text-tertiary">
        <div className="text-center">
          <Flag className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">No milestones to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-start gap-8 px-4 min-w-max">
        {sortedMilestones.map((milestone, index) => (
          <TimelineNode
            key={getMilestoneId(milestone) || `milestone-${index}`}
            milestone={milestone}
            isFirst={index === 0}
            isLast={index === sortedMilestones.length - 1}
            onClick={onMilestoneClick}
          />
        ))}
      </div>
    </div>
  );
};

export default MilestoneTimeline;
