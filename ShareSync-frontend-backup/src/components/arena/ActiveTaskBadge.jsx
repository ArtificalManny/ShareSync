// src/components/arena/ActiveTaskBadge.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10.1: Live Arena - Active Task Badge
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shows what task someone is currently working on.
// Respects privacy settings - only shows if user has opted in.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Code, FileText, Rocket, Eye, Target, Zap } from 'lucide-react';
import { ACTIVITY_TYPES } from '../../contexts/PresenceContext';

/**
 * ActiveTaskBadge - Shows current task with activity type
 * 
 * @param {string} taskName - Name of the task
 * @param {string} projectName - Name of the project (optional)
 * @param {string} activityType - ACTIVITY_TYPES value
 * @param {boolean} compact - Compact mode
 */
export default function ActiveTaskBadge({ 
  taskName,
  projectName,
  activityType,
  compact = false,
}) {
  if (!taskName && !projectName) return null;

  const activityConfig = {
    [ACTIVITY_TYPES.EDITING]: {
      icon: Code,
      label: 'Editing',
      color: 'text-blue-400',
    },
    [ACTIVITY_TYPES.VIEWING]: {
      icon: Eye,
      label: 'Viewing',
      color: 'text-text-tertiary',
    },
    [ACTIVITY_TYPES.SHIPPING]: {
      icon: Rocket,
      label: 'Shipping',
      color: 'text-success',
    },
    [ACTIVITY_TYPES.REVIEWING]: {
      icon: FileText,
      label: 'Reviewing',
      color: 'text-warning',
    },
    [ACTIVITY_TYPES.FOCUS_SESSION]: {
      icon: Target,
      label: 'Deep Focus',
      color: 'text-brand',
    },
  };

  const config = activityConfig[activityType] || {
    icon: Zap,
    label: 'Working on',
    color: 'text-text-secondary',
  };

  const Icon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-text-secondary truncate max-w-[180px]">
        <Icon className={`w-3 h-3 shrink-0 ${config.color}`} />
        <span className="truncate">{taskName || projectName}</span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-surface-2 border border-white/[0.06]">
      {/* Activity type */}
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
          {config.label}
        </span>
      </div>
      
      {/* Task name */}
      {taskName && (
        <p className="text-sm font-medium text-text-primary truncate mb-1">
          {taskName}
        </p>
      )}
      
      {/* Project name */}
      {projectName && (
        <p className="text-xs text-text-tertiary truncate">
          in {projectName}
        </p>
      )}
    </div>
  );
}

/**
 * ActivityTypeIcon - Just the icon for an activity type
 */
export function ActivityTypeIcon({ type, className = '' }) {
  const icons = {
    [ACTIVITY_TYPES.EDITING]: Code,
    [ACTIVITY_TYPES.VIEWING]: Eye,
    [ACTIVITY_TYPES.SHIPPING]: Rocket,
    [ACTIVITY_TYPES.REVIEWING]: FileText,
    [ACTIVITY_TYPES.FOCUS_SESSION]: Target,
  };

  const Icon = icons[type] || Zap;
  return <Icon className={className} />;
}

/**
 * WorkingOnBadge - Inline "Working on: X" badge
 */
export function WorkingOnBadge({ taskName, className = '' }) {
  if (!taskName) return null;

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
      bg-surface-2 border border-white/[0.06]
      ${className}
    `}>
      <Zap className="w-3.5 h-3.5 text-brand" />
      <span className="text-xs text-text-secondary">Working on:</span>
      <span className="text-xs font-medium text-text-primary truncate max-w-[120px]">
        {taskName}
      </span>
    </div>
  );
}
