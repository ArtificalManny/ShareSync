// src/components/predict/CapacityPlanning.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PREDICT ENGINE: Team Capacity Planning
// Visualize and forecast team workload
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  Users, User, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, ArrowRight, Zap, TrendingUp, BarChart2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CAPACITY STATUS CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  overloaded: {
    color: 'text-error-400',
    bgColor: 'bg-error-500/10',
    borderColor: 'border-error-500/30',
    barColor: 'bg-error-500',
    label: 'Overloaded',
    icon: AlertTriangle,
  },
  full: {
    color: 'text-warning-400',
    bgColor: 'bg-warning-500/10',
    borderColor: 'border-warning-500/30',
    barColor: 'bg-warning-500',
    label: 'Full',
    icon: Clock,
  },
  healthy: {
    color: 'text-success-400',
    bgColor: 'bg-success-500/10',
    borderColor: 'border-success-500/30',
    barColor: 'bg-success-500',
    label: 'Healthy',
    icon: CheckCircle2,
  },
  available: {
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    barColor: 'bg-cyan-500',
    label: 'Available',
    icon: Zap,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CAPACITY BAR
// ═══════════════════════════════════════════════════════════════════════════════

function CapacityBar({ utilization, status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;
  const displayWidth = Math.min(utilization, 150); // Cap visual at 150%
  
  return (
    <div className="relative">
      {/* Background */}
      <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
        {/* Fill */}
        <div 
          className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
          style={{ width: `${Math.min(displayWidth, 100)}%` }}
        />
      </div>
      
      {/* Overflow indicator */}
      {utilization > 100 && (
        <div 
          className="absolute top-0 h-3 rounded-full bg-error-500/50"
          style={{ 
            left: '100%',
            width: `${(displayWidth - 100) * 0.5}%`,
            maxWidth: '25%',
          }}
        />
      )}
      
      {/* 100% marker */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white/30"
        style={{ left: '100%' }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER CAPACITY ROW
// ═══════════════════════════════════════════════════════════════════════════════

function MemberCapacityRow({
  data,
  onRebalance,
  isExpanded,
  onToggle,
}) {
  const { member, assignedTasks, totalHours, capacity, utilization, status, availableHours } = data;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;
  const StatusIcon = config.icon;
  
  return (
    <div className={`
      rounded-xl border transition-all duration-200
      ${config.bgColor} ${config.borderColor}
    `}>
      {/* Main row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
          {member.avatar ? (
            <img src={member.avatar} alt="" className="w-full h-full rounded-full" />
          ) : (
            <span className="text-sm font-medium text-text-secondary">
              {member.name?.charAt(0)}
            </span>
          )}
        </div>
        
        {/* Name and status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-text-primary truncate">
              {member.name}
            </span>
            <span className={`text-xs ${config.color}`}>
              {config.label}
            </span>
            {status === 'overloaded' && (
              <AlertTriangle className="w-3 h-3 text-error-400" />
            )}
          </div>
          
          {/* Capacity bar */}
          <CapacityBar utilization={utilization} status={status} />
        </div>
        
        {/* Percentage */}
        <div className={`text-right ${config.color}`}>
          <div className="text-lg font-bold">{utilization}%</div>
          <div className="text-xs text-text-tertiary">
            {assignedTasks} tasks
          </div>
        </div>
      </button>
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06]">
          <div className="grid grid-cols-3 gap-4 mt-3 text-center">
            <div>
              <div className="text-lg font-bold text-text-primary">{Math.round(totalHours)}h</div>
              <div className="text-xs text-text-tertiary">Assigned</div>
            </div>
            <div>
              <div className="text-lg font-bold text-text-primary">{Math.round(capacity)}h</div>
              <div className="text-xs text-text-tertiary">Capacity</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${availableHours > 0 ? 'text-success-400' : 'text-error-400'}`}>
                {availableHours > 0 ? `+${Math.round(availableHours)}h` : `${Math.round(availableHours)}h`}
              </div>
              <div className="text-xs text-text-tertiary">Available</div>
            </div>
          </div>
          
          {onRebalance && status === 'overloaded' && (
            <button
              onClick={() => onRebalance(member)}
              className="w-full mt-3 py-2 rounded-lg bg-error-500/20 text-error-400 text-sm hover:bg-error-500/30 transition-colors"
            >
              Rebalance Workload
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CAPACITY PLANNING PANEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CapacityPlanningPanel - Team workload visualization
 */
export function CapacityPlanningPanel({
  capacity = [],
  timeframe = 'Next Week',
  onRebalance,
  onViewDetails,
  className = '',
}) {
  const [expandedId, setExpandedId] = useState(null);
  
  // Sort by utilization (overloaded first)
  const sortedCapacity = useMemo(() => 
    [...capacity].sort((a, b) => b.utilization - a.utilization),
    [capacity]
  );
  
  // Summary stats
  const summary = useMemo(() => {
    const overloaded = capacity.filter(c => c.status === 'overloaded').length;
    const available = capacity.filter(c => c.status === 'available').length;
    const avgUtilization = capacity.length > 0
      ? Math.round(capacity.reduce((sum, c) => sum + c.utilization, 0) / capacity.length)
      : 0;
    const totalAvailable = capacity.reduce((sum, c) => sum + Math.max(0, c.availableHours), 0);
    
    return { overloaded, available, avgUtilization, totalAvailable };
  }, [capacity]);
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-surface-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Team Capacity
              </div>
              <div className="text-sm text-text-tertiary">
                {timeframe} Forecast
              </div>
            </div>
          </div>
          
          {/* Summary badges */}
          <div className="flex items-center gap-2">
            {summary.overloaded > 0 && (
              <span className="px-2 py-1 rounded-full bg-error-500/20 text-error-400 text-xs font-medium">
                {summary.overloaded} overloaded
              </span>
            )}
            {summary.available > 0 && (
              <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                {summary.available} available
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="px-4 py-3 border-b border-white/[0.06] grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-text-primary">{summary.avgUtilization}%</div>
          <div className="text-xs text-text-tertiary">Avg Utilization</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-text-primary">{capacity.length}</div>
          <div className="text-xs text-text-tertiary">Team Members</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-success-400">+{Math.round(summary.totalAvailable)}h</div>
          <div className="text-xs text-text-tertiary">Available Hours</div>
        </div>
      </div>
      
      {/* Member list */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {sortedCapacity.map((data, idx) => (
          <MemberCapacityRow
            key={data.member.id || idx}
            data={data}
            onRebalance={onRebalance}
            isExpanded={expandedId === data.member.id}
            onToggle={() => setExpandedId(
              expandedId === data.member.id ? null : data.member.id
            )}
          />
        ))}
      </div>
      
      {/* Actions */}
      {summary.overloaded > 0 && onRebalance && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onRebalance(null)}
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-400 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Rebalance Team</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI CAPACITY WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniCapacityWidget - Compact capacity view for dashboard
 */
export function MiniCapacityWidget({
  capacity = [],
  onClick,
  className = '',
}) {
  const overloadedCount = capacity.filter(c => c.status === 'overloaded').length;
  const availableCount = capacity.filter(c => c.status === 'available').length;
  const avgUtilization = capacity.length > 0
    ? Math.round(capacity.reduce((sum, c) => sum + c.utilization, 0) / capacity.length)
    : 0;
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 transition-colors
        text-left group
        ${className}
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-brand-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-text-primary">Team Capacity</div>
          <div className="text-xs text-text-tertiary">{capacity.length} members</div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
      </div>
      
      {/* Mini bars */}
      <div className="flex gap-1">
        {capacity.slice(0, 6).map((c, idx) => (
          <div key={idx} className="flex-1 h-8 bg-surface-3 rounded overflow-hidden flex flex-col-reverse">
            <div 
              className={`w-full transition-all ${STATUS_CONFIG[c.status].barColor}`}
              style={{ height: `${Math.min(c.utilization, 100)}%` }}
            />
          </div>
        ))}
      </div>
      
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-text-tertiary">{avgUtilization}% avg</span>
        <div className="flex gap-2">
          {overloadedCount > 0 && (
            <span className="text-error-400">{overloadedCount} overloaded</span>
          )}
          {availableCount > 0 && (
            <span className="text-cyan-400">{availableCount} available</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default CapacityPlanningPanel;
