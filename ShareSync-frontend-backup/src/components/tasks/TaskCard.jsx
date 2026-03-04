// src/components/tasks/TaskCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE B: Living Cards - Task Card Component
// PHASE 3: Floating XP, Confetti Bursts, Checkbox Bounce, and Skeleton Shimmer
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  XCircle,
  Radio,
  User,
  Tag,
} from 'lucide-react';
import { useLivingCard } from '../../hooks/useLivingCard';
import FloatingXP from '../effects/FloatingXP';

/**
 * TaskCard - A living card for tasks
 */
const TaskCard = ({ 
  task, 
  onClick,
  showProgress = true,
  showAssignee = false,
  showTags = false,
  compact = false,
  className = '',
}) => {
  const {
    id,
    title,
    description,
    progress = 0,
    priority = 'normal', // 'low' | 'normal' | 'high' | 'urgent'
    status = 'active', // 'active' | 'completed' | 'blocked' | 'archived'
    dueDate,
    lastActivity,
    completedAt,
    isBlocked = false,
    blockers = [],
    isLive = false,
    assignee,
    tags = [],
    emoji,
    category,
    xp = 15, // Default XP for completing a task
  } = task;

  // Calculate living state from task data
  const livingState = useLivingCard({
    progress,
    priority,
    status,
    lastActivity,
    dueDate,
    completedAt,
    isBlocked,
    blockers,
    isLive,
  });

  const isComplete = livingState.isComplete;
  
  // ⭐ PHASE 3: Animation State Management
  const [showXP, setShowXP] = useState(false);
  const [xpCoords, setXpCoords] = useState({ x: 0, y: 0 });
  const iconRef = useRef(null);
  const prevComplete = useRef(isComplete);

  useEffect(() => {
    // Detect when task flips to 'Complete'
    if (isComplete && !prevComplete.current) {
      if (iconRef.current) {
        const rect = iconRef.current.getBoundingClientRect();
        // Position XP slightly above and centered on the icon
        setXpCoords({ x: rect.left + rect.width / 2 - 20, y: rect.top - 15 });
        setShowXP(true);
        // Clean up the FloatingXP component after animation
        setTimeout(() => setShowXP(false), 1500);
      }
    }
    prevComplete.current = isComplete;
  }, [isComplete]);
  
  // Progress bar color based on state
  const getProgressColor = () => {
    if (isComplete) return 'bg-success';
    if (livingState.state === 'completing') return 'bg-cyan-500';
    if (livingState.state === 'blocked') return 'bg-error/50';
    if (progress >= 67) return 'bg-brand-400';
    if (progress >= 34) return 'bg-brand';
    return 'bg-brand-700';
  };

  // Priority indicator
  const getPriorityIndicator = () => {
    if (priority === 'urgent') return <AlertTriangle className="w-3 h-3 text-error" />;
    if (priority === 'high') return <AlertTriangle className="w-3 h-3 text-warning" />;
    return null;
  };

  // Status indicator for live/blocked
  const getStatusIndicator = () => {
    if (isLive) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-medium text-cyan-500">
          <Radio className="w-3 h-3 live-indicator" />
          Live
        </span>
      );
    }
    if (livingState.isBlocked) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-medium text-error">
          <XCircle className="w-3 h-3" />
          Blocked
        </span>
      );
    }
    return null;
  };

  // Format due date
  const formatDueDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diff = d - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, isOverdue: true };
    if (days === 0) return { text: 'Due today', isUrgent: true };
    if (days === 1) return { text: 'Due tomorrow', isUrgent: true };
    if (days <= 7) return { text: `${days}d left`, isUpcoming: true };
    return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  };

  const dueDateInfo = formatDueDate(dueDate);

  // Detect if the task is urgent for the Glow System (Phase 2.6)
  const isTaskUrgent = priority === 'urgent' || dueDateInfo?.isUrgent;

  return (
    <>
      <div 
        onClick={() => onClick?.(task)}
        className={`
          group card-surface ${livingState.className}
          flex items-center gap-4 rounded-xl cursor-pointer
          transition-all duration-200
          ${compact ? 'p-3' : 'p-4'}
          ${isTaskUrgent ? 'task-urgent-glow' : ''}
          ${className}
        `}
        data-living-state={livingState.state}
        data-task-id={id}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 1: Identity (What is this?)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          
          {/* Task Icon/Emoji/Checkbox */}
          <div 
            ref={iconRef}
            className={`
              relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0
              transition-all duration-200
              ${isComplete 
                ? 'bg-success/10' 
                : livingState.isBlocked 
                  ? 'bg-error/10'
                  : livingState.isPriority
                    ? 'bg-warning/10'
                    : 'bg-surface-2 group-hover:bg-brand/10'
              }
            `}
          >
            {/* ⭐ PHASE 3: Confetti Micro-Burst when completed */}
            <AnimatePresence>
              {showXP && [...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: 0, 
                    scale: 1.5, 
                    x: Math.cos((i * 60) * (Math.PI / 180)) * 24, 
                    y: Math.sin((i * 60) * (Math.PI / 180)) * 24 
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute w-1.5 h-1.5 rounded-full z-10"
                  style={{ backgroundColor: '#7C3AED' }}
                />
              ))}
            </AnimatePresence>

            {isComplete ? (
              <CheckCircle2 className={`w-5 h-5 text-success ${showXP ? 'animate-checkbox-bounce' : ''}`} />
            ) : livingState.isBlocked ? (
              <XCircle className="w-5 h-5 text-error" />
            ) : emoji ? (
              <span className="text-lg">{emoji}</span>
            ) : (
              <div className={`
                w-5 h-5 rounded-full border-2 
                ${livingState.isPriority ? 'border-warning' : 'border-text-tertiary'}
                group-hover:border-brand transition-colors
              `} />
            )}
          </div>

          {/* Title + Meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {getPriorityIndicator()}
              <h4 className={`
                text-sm font-medium truncate transition-colors task-title
                ${isComplete 
                  ? 'text-text-tertiary line-through' 
                  : 'text-text-primary group-hover:text-brand'
                }
              `}>
                {title}
              </h4>
            </div>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {/* Category */}
              {category && (
                <span className="text-xs text-text-tertiary truncate max-w-[100px]">
                  {category}
                </span>
              )}
              
              {/* Due date */}
              {dueDateInfo && !isComplete && (
                <>
                  {category && <span className="text-text-tertiary opacity-50">·</span>}
                  <span className={`
                    flex items-center gap-1 text-xs shrink-0
                    ${dueDateInfo.isOverdue ? 'text-error' : ''}
                    ${dueDateInfo.isUrgent ? 'text-warning' : ''}
                    ${!dueDateInfo.isOverdue && !dueDateInfo.isUrgent ? 'text-text-tertiary' : ''}
                  `}>
                    <Calendar className="w-3 h-3" />
                    {dueDateInfo.text}
                  </span>
                </>
              )}
              
              {/* Assignee */}
              {showAssignee && assignee && (
                <>
                  <span className="text-text-tertiary opacity-50">·</span>
                  <span className="flex items-center gap-1 text-xs text-text-tertiary">
                    <User className="w-3 h-3" />
                    {assignee.name || assignee}
                  </span>
                </>
              )}

              {/* Live/Blocked status indicator */}
              {getStatusIndicator()}
            </div>

            {/* Tags */}
            {showTags && tags.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {tags.slice(0, 3).map((tag, i) => (
                  <span 
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-surface-2 text-text-tertiary"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="text-[10px] text-text-tertiary">
                    +{tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 2: Progress
        ═══════════════════════════════════════════════════════════════════ */}
        {showProgress && !isComplete && (
          <div className="hidden sm:flex items-center gap-3 w-32 shrink-0">
            <div className="flex-1">
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden card-progress">
                <div 
                  className={`h-full rounded-full transition-all duration-500 card-progress-fill ${getProgressColor()}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium w-8 text-right text-text-secondary">
              {progress}%
            </span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 3: Action / State Badge
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 shrink-0">
          {/* State-specific badge */}
          {livingState.state === 'stale' && (
            <span className="nudge-action text-[10px] font-medium text-text-tertiary bg-surface-2 px-2 py-1 rounded">
              Nudge
            </span>
          )}
          
          {livingState.state === 'completing' && (
            <span className="text-[10px] font-medium text-cyan-500">
              Almost there!
            </span>
          )}

          {isComplete && (
            <span className="text-xs font-medium text-success">
              Done
            </span>
          )}

          <ChevronRight className="
            w-4 h-4 text-text-tertiary
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
          " />
        </div>
      </div>

      {/* ⭐ PHASE 3: Floating XP Render */}
      {showXP && <FloatingXP amount={xp} x={xpCoords.x} y={xpCoords.y} />}
    </>
  );
};

export default TaskCard;

// ⭐ PHASE 3: Replaced standard pulse with our premium .skeleton
export function TaskCardSkeleton({ compact = false }) {
  return (
    <div className={`
      flex items-center gap-4 rounded-xl
      card-surface
      ${compact ? 'p-3' : 'p-4'}
    `}>
      <div className="w-10 h-10 skeleton" style={{ borderRadius: '12px' }} />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 skeleton" />
        <div className="h-3 w-1/2 skeleton" />
      </div>
      <div className="w-24 h-1.5 skeleton" style={{ borderRadius: '9999px' }} />
    </div>
  );
}

export function TaskCardEmpty({ 
  message = "No tasks yet",
  action,
  actionLabel = "Add task",
}) {
  return (
    <div className="
      card-surface
      flex flex-col items-center justify-center 
      p-8 text-center rounded-xl
    ">
      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
        <CheckCircle2 className="w-6 h-6 text-text-tertiary" />
      </div>
      <p className="text-sm text-text-secondary mb-4">{message}</p>
      {action && (
        <button 
          onClick={action}
          className="text-sm font-medium text-brand hover:text-brand-400 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
