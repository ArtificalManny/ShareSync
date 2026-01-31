// src/components/social/BlockingVisualizer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL FABRIC: Blocking Visualizer
// Shows visual dependency lines between tasks
// "Sarah is waiting on you" - makes blocking relationships tangible
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowRight, AlertTriangle, Clock, User, Users,
  ChevronRight, Unlock, Lock, Zap, CheckCircle2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKING STATUS
// ═══════════════════════════════════════════════════════════════════════════════

export const BLOCKING_STATUS = {
  BLOCKING: 'blocking',       // This task blocks others
  BLOCKED: 'blocked',         // This task is blocked
  CLEAR: 'clear',             // No blocking relationships
};

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKING BADGE - Shows on task cards
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BlockingBadge - Shows blocking status on task cards
 */
export function BlockingBadge({
  status,
  count = 0,
  blockedBy = [],
  blocking = [],
  onClick,
  className = '',
}) {
  if (status === BLOCKING_STATUS.CLEAR && count === 0) return null;
  
  const isBlocking = status === BLOCKING_STATUS.BLOCKING || blocking.length > 0;
  const isBlocked = status === BLOCKING_STATUS.BLOCKED || blockedBy.length > 0;
  
  if (isBlocking) {
    return (
      <button
        onClick={onClick}
        className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full
          bg-warning-500/10 border border-warning-500/30
          hover:bg-warning-500/20 transition-colors
          ${className}
        `}
        title={`Blocking ${blocking.length} task${blocking.length !== 1 ? 's' : ''}`}
      >
        <Lock className="w-3 h-3 text-warning-500" />
        <span className="text-[10px] font-medium text-warning-500">
          Blocks {blocking.length}
        </span>
      </button>
    );
  }
  
  if (isBlocked) {
    return (
      <button
        onClick={onClick}
        className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full
          bg-error-500/10 border border-error-500/30
          hover:bg-error-500/20 transition-colors
          ${className}
        `}
        title={`Blocked by ${blockedBy.length} task${blockedBy.length !== 1 ? 's' : ''}`}
      >
        <AlertTriangle className="w-3 h-3 text-error-400" />
        <span className="text-[10px] font-medium text-error-400">
          Blocked
        </span>
      </button>
    );
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKING CHAIN - Visual chain of dependencies
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BlockingChain - Shows the chain of blocking dependencies
 */
export function BlockingChain({
  task,
  blockedTasks = [],
  blockedByTasks = [],
  onTaskClick,
  variant = 'horizontal', // 'horizontal' | 'vertical'
  className = '',
}) {
  const hasBlocking = blockedTasks.length > 0;
  const hasBlockedBy = blockedByTasks.length > 0;
  
  if (!hasBlocking && !hasBlockedBy) return null;
  
  const ChainConnector = ({ direction = 'right' }) => (
    <div className={`
      flex items-center justify-center
      ${variant === 'vertical' ? 'py-1' : 'px-2'}
    `}>
      {variant === 'vertical' ? (
        <div className="w-0.5 h-4 bg-warning-500/50 rounded-full" />
      ) : (
        <ArrowRight className="w-4 h-4 text-warning-500/50" />
      )}
    </div>
  );
  
  const TaskNode = ({ t, isBlocking, isBlocked, isCurrent }) => (
    <button
      onClick={() => onTaskClick?.(t)}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        border transition-all duration-200
        ${isCurrent 
          ? 'bg-brand-500/10 border-brand-500/30' 
          : isBlocking
          ? 'bg-warning-500/5 border-warning-500/20 hover:border-warning-500/40'
          : isBlocked
          ? 'bg-error-500/5 border-error-500/20 hover:border-error-500/40'
          : 'bg-surface-1 border-white/[0.06] hover:border-white/[0.1]'
        }
      `}
    >
      {isBlocking && <Lock className="w-3 h-3 text-warning-500" />}
      {isBlocked && <AlertTriangle className="w-3 h-3 text-error-400" />}
      {isCurrent && <Zap className="w-3 h-3 text-brand-400" />}
      
      <div className="text-left min-w-0">
        <div className="text-xs font-medium text-text-primary truncate max-w-[120px]">
          {t.title}
        </div>
        {t.assignee && (
          <div className="text-[10px] text-text-tertiary truncate">
            {t.assignee.name}
          </div>
        )}
      </div>
    </button>
  );
  
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        {/* Blocked by (upstream) */}
        {blockedByTasks.map((t, idx) => (
          <React.Fragment key={t.id}>
            <TaskNode t={t} isBlocking />
            <ChainConnector />
          </React.Fragment>
        ))}
        
        {/* Current task */}
        <TaskNode t={task} isCurrent />
        
        {/* Blocking (downstream) */}
        {blockedTasks.map((t, idx) => (
          <React.Fragment key={t.id}>
            <ChainConnector />
            <TaskNode t={t} isBlocked />
          </React.Fragment>
        ))}
      </div>
    );
  }
  
  // Horizontal variant
  return (
    <div className={`flex items-center overflow-x-auto ${className}`}>
      {/* Blocked by (upstream) */}
      {blockedByTasks.map((t, idx) => (
        <React.Fragment key={t.id}>
          <TaskNode t={t} isBlocking />
          <ChainConnector />
        </React.Fragment>
      ))}
      
      {/* Current task */}
      <TaskNode t={task} isCurrent />
      
      {/* Blocking (downstream) */}
      {blockedTasks.map((t, idx) => (
        <React.Fragment key={t.id}>
          <ChainConnector />
          <TaskNode t={t} isBlocked />
        </React.Fragment>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAITING ON YOU BANNER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WaitingOnYouBanner - Alert showing teammates waiting on your task
 */
export function WaitingOnYouBanner({
  task,
  waitingUsers = [],
  waitingTasks = [],
  onTaskClick,
  onDismiss,
  className = '',
}) {
  if (waitingUsers.length === 0 && waitingTasks.length === 0) return null;
  
  const waitingText = waitingUsers.length === 1
    ? `${waitingUsers[0].name} is waiting on you`
    : waitingUsers.length === 2
    ? `${waitingUsers[0].name} and ${waitingUsers[1].name} are waiting on you`
    : `${waitingUsers[0].name} and ${waitingUsers.length - 1} others are waiting on you`;
  
  return (
    <div className={`
      p-4 rounded-xl
      bg-warning-500/10 border border-warning-500/30
      ${className}
    `}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning-500/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-warning-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-warning-500 mb-1">
            {waitingText}
          </div>
          
          {task && (
            <div className="text-xs text-text-secondary mb-2">
              Complete "<span className="font-medium">{task.title}</span>" to unblock them
            </div>
          )}
          
          {/* Waiting users avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {waitingUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="w-7 h-7 rounded-full bg-surface-2 border-2 border-surface-0 flex items-center justify-center"
                  title={user.name}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-xs text-text-tertiary">
                      {user.name?.charAt(0)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {waitingTasks.length > 0 && (
              <span className="text-xs text-text-tertiary">
                · {waitingTasks.length} task{waitingTasks.length !== 1 ? 's' : ''} blocked
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onTaskClick?.(task)}
          className="
            px-3 py-1.5 rounded-lg
            bg-warning-500 text-white text-sm font-medium
            hover:bg-warning-400 transition-colors
            flex items-center gap-1
          "
        >
          <Unlock className="w-3 h-3" />
          <span>Unblock</span>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPENDENCY GRAPH - SVG visualization
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DependencyGraph - Full SVG graph of task dependencies
 */
export function DependencyGraph({
  tasks = [],
  dependencies = [], // [{ from: taskId, to: taskId }]
  currentTaskId,
  onTaskClick,
  width = 600,
  height = 400,
  className = '',
}) {
  const containerRef = useRef(null);
  const [positions, setPositions] = useState({});
  
  // Calculate positions using simple force-directed layout
  useEffect(() => {
    if (tasks.length === 0) return;
    
    // Simple grid layout for now
    const cols = Math.ceil(Math.sqrt(tasks.length));
    const cellWidth = width / (cols + 1);
    const cellHeight = height / (Math.ceil(tasks.length / cols) + 1);
    
    const newPositions = {};
    tasks.forEach((task, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      newPositions[task.id] = {
        x: (col + 1) * cellWidth,
        y: (row + 1) * cellHeight,
      };
    });
    
    setPositions(newPositions);
  }, [tasks, width, height]);
  
  // Draw dependency lines
  const lines = useMemo(() => {
    return dependencies.map((dep, idx) => {
      const from = positions[dep.from];
      const to = positions[dep.to];
      if (!from || !to) return null;
      
      const isCriticalPath = dep.from === currentTaskId || dep.to === currentTaskId;
      
      return (
        <g key={idx}>
          {/* Line */}
          <line
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isCriticalPath ? '#F59E0B' : 'rgba(255,255,255,0.1)'}
            strokeWidth={isCriticalPath ? 2 : 1}
            strokeDasharray={isCriticalPath ? '' : '4'}
          />
          {/* Arrow head */}
          <polygon
            points={`${to.x},${to.y} ${to.x - 8},${to.y - 4} ${to.x - 8},${to.y + 4}`}
            fill={isCriticalPath ? '#F59E0B' : 'rgba(255,255,255,0.2)'}
            transform={`rotate(${Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI}, ${to.x}, ${to.y})`}
          />
        </g>
      );
    }).filter(Boolean);
  }, [dependencies, positions, currentTaskId]);
  
  // Draw task nodes
  const nodes = useMemo(() => {
    return tasks.map(task => {
      const pos = positions[task.id];
      if (!pos) return null;
      
      const isCurrent = task.id === currentTaskId;
      const isBlocking = dependencies.some(d => d.from === task.id);
      const isBlocked = dependencies.some(d => d.to === task.id);
      
      return (
        <g
          key={task.id}
          transform={`translate(${pos.x}, ${pos.y})`}
          onClick={() => onTaskClick?.(task)}
          className="cursor-pointer"
        >
          {/* Node circle */}
          <circle
            r={isCurrent ? 24 : 20}
            fill={
              isCurrent ? '#7C3AED' :
              isBlocking ? '#F59E0B' :
              isBlocked ? '#EF4444' :
              '#1F2937'
            }
            stroke={isCurrent ? '#A78BFA' : 'rgba(255,255,255,0.1)'}
            strokeWidth={2}
          />
          
          {/* Status icon */}
          {task.completed && (
            <text x="0" y="5" textAnchor="middle" fill="white" fontSize="16">
              ✓
            </text>
          )}
          
          {/* Label */}
          <text
            y={32}
            textAnchor="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize="10"
          >
            {task.title?.slice(0, 15)}...
          </text>
        </g>
      );
    }).filter(Boolean);
  }, [tasks, positions, dependencies, currentTaskId, onTaskClick]);
  
  return (
    <div ref={containerRef} className={className}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Lines first (behind nodes) */}
        {lines}
        {/* Nodes on top */}
        {nodes}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKING SUMMARY - Compact summary card
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BlockingSummary - Summary of all blocking relationships
 */
export function BlockingSummary({
  blockingCount = 0,
  blockedByCount = 0,
  waitingUsers = [],
  onViewDetails,
  className = '',
}) {
  if (blockingCount === 0 && blockedByCount === 0) return null;
  
  return (
    <button
      onClick={onViewDetails}
      className={`
        flex items-center gap-3 p-3 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 transition-colors
        text-left w-full
        ${className}
      `}
    >
      <div className="w-10 h-10 rounded-lg bg-warning-500/10 flex items-center justify-center">
        <Lock className="w-5 h-5 text-warning-500" />
      </div>
      
      <div className="flex-1">
        <div className="text-sm font-medium text-text-primary">
          {blockingCount > 0 && `${blockingCount} task${blockingCount !== 1 ? 's' : ''} waiting on you`}
          {blockingCount > 0 && blockedByCount > 0 && ' · '}
          {blockedByCount > 0 && `${blockedByCount} blocker${blockedByCount !== 1 ? 's' : ''}`}
        </div>
        {waitingUsers.length > 0 && (
          <div className="text-xs text-text-tertiary">
            {waitingUsers.map(u => u.name).join(', ')}
          </div>
        )}
      </div>
      
      <ChevronRight className="w-4 h-4 text-text-tertiary" />
    </button>
  );
}

export default BlockingVisualizer;
