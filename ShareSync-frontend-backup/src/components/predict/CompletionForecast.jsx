// src/components/predict/CompletionForecast.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PREDICT ENGINE: Completion Forecasting
// Shows predicted completion based on current velocity
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Clock, Target, Zap,
  AlertTriangle, CheckCircle2, Calendar, ChevronRight,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════════

function ForecastProgressBar({ 
  current, 
  projected, 
  boosted, 
  showLegend = true,
}) {
  return (
    <div className="space-y-3">
      {/* Current progress */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-tertiary">Current</span>
          <span className="text-text-primary font-medium">{current}%</span>
        </div>
        <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${current}%` }}
          />
        </div>
      </div>
      
      {/* Projected at current pace */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-tertiary">At current pace</span>
          <span className={`font-medium ${projected >= 95 ? 'text-success-400' : projected >= 80 ? 'text-warning-400' : 'text-error-400'}`}>
            {projected}% by deadline
          </span>
        </div>
        <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              projected >= 95 ? 'bg-success-500' : projected >= 80 ? 'bg-warning-500' : 'bg-error-500'
            }`}
            style={{ width: `${projected}%` }}
          />
        </div>
      </div>
      
      {/* Boosted projection */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-tertiary">With 10% more effort</span>
          <span className="text-cyan-400 font-medium">{boosted}% by deadline</span>
        </div>
        <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${boosted}%` }}
          />
        </div>
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="flex items-center gap-4 text-[10px] text-text-tertiary pt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-warning-500" />
            <span>Projected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>Boosted</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VELOCITY INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

function VelocityIndicator({ current, required, className = '' }) {
  const gap = required - current;
  const isBehind = gap > 0;
  const percentage = required > 0 ? (current / required) * 100 : 100;
  
  return (
    <div className={`p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-tertiary">Daily velocity</span>
        <span className={`text-sm font-medium ${isBehind ? 'text-warning-400' : 'text-success-400'}`}>
          {isBehind ? 'Behind pace' : 'On track'}
        </span>
      </div>
      
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <div className="text-3xl font-bold text-text-primary">
            {current.toFixed(1)}
          </div>
          <div className="text-xs text-text-tertiary">tasks/day</div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-text-tertiary mb-1">
            Need: {required.toFixed(1)}/day
          </div>
          {gap !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${isBehind ? 'text-warning-400' : 'text-success-400'}`}>
              {isBehind ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              <span>{Math.abs(gap).toFixed(1)} {isBehind ? 'more needed' : 'ahead'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEADLINE STATUS
// ═══════════════════════════════════════════════════════════════════════════════

function DeadlineStatus({ forecast, deadline }) {
  const deadlineDate = new Date(deadline);
  const isOverdue = new Date() > deadlineDate;
  
  return (
    <div className={`
      p-4 rounded-xl border
      ${forecast.isOnTrack 
        ? 'bg-success-500/10 border-success-500/30'
        : forecast.isAtRisk
        ? 'bg-error-500/10 border-error-500/30'
        : 'bg-warning-500/10 border-warning-500/30'
      }
    `}>
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${forecast.isOnTrack 
            ? 'bg-success-500/20'
            : forecast.isAtRisk
            ? 'bg-error-500/20'
            : 'bg-warning-500/20'
          }
        `}>
          {forecast.isOnTrack ? (
            <CheckCircle2 className="w-5 h-5 text-success-500" />
          ) : forecast.isAtRisk ? (
            <AlertTriangle className="w-5 h-5 text-error-500" />
          ) : (
            <Clock className="w-5 h-5 text-warning-500" />
          )}
        </div>
        
        <div className="flex-1">
          <div className={`text-sm font-medium ${
            forecast.isOnTrack 
              ? 'text-success-500'
              : forecast.isAtRisk
              ? 'text-error-500'
              : 'text-warning-500'
          }`}>
            {forecast.isOnTrack 
              ? 'On track to complete'
              : forecast.isAtRisk
              ? 'At risk of missing deadline'
              : 'May need attention'
            }
          </div>
          <div className="text-xs text-text-tertiary">
            {forecast.daysRemaining} days until {deadlineDate.toLocaleDateString()}
          </div>
        </div>
        
        {forecast.daysAhead !== 0 && (
          <div className={`text-right ${forecast.daysAhead > 0 ? 'text-success-400' : 'text-error-400'}`}>
            <div className="text-lg font-bold">
              {Math.abs(forecast.daysAhead)}d
            </div>
            <div className="text-xs">
              {forecast.daysAhead > 0 ? 'ahead' : 'behind'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPLETION FORECAST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CompletionForecast - Full forecast visualization
 */
export function CompletionForecast({
  forecast,
  sprint,
  onAdjustScope,
  onAddResources,
  onExtendDeadline,
  className = '',
}) {
  if (!forecast || !sprint) return null;
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-surface-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-text-primary">
              {sprint.name || 'Sprint'} Forecast
            </div>
            <div className="text-sm text-text-tertiary">
              Based on current velocity
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-400">
              {forecast.projectedCompletion}%
            </div>
            <div className="text-xs text-text-tertiary">projected</div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Deadline status */}
        <DeadlineStatus forecast={forecast} deadline={sprint.deadline} />
        
        {/* Progress bars */}
        <ForecastProgressBar
          current={forecast.currentCompletion}
          projected={forecast.projectedCompletion}
          boosted={forecast.boostedCompletion}
        />
        
        {/* Velocity indicator */}
        <VelocityIndicator
          current={forecast.currentVelocity}
          required={forecast.requiredVelocity}
        />
        
        {/* Required action */}
        {forecast.projectedCompletion < 100 && (
          <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
            <div className="text-sm text-text-primary mb-2">
              To finish Available by deadline:
            </div>
            <div className="text-lg font-semibold text-brand-400">
              Need {forecast.requiredVelocity} ships/day 
              <span className="text-text-tertiary font-normal text-sm ml-2">
                (currently {forecast.currentVelocity})
              </span>
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        {forecast.projectedCompletion < 95 && (
          <div className="flex flex-wrap gap-2">
            {onAdjustScope && (
              <button
                onClick={onAdjustScope}
                className="px-4 py-2 rounded-lg bg-surface-2 text-text-secondary text-sm hover:bg-surface-3 transition-colors"
              >
                Adjust Scope
              </button>
            )}
            {onAddResources && (
              <button
                onClick={onAddResources}
                className="px-4 py-2 rounded-lg bg-surface-2 text-text-secondary text-sm hover:bg-surface-3 transition-colors"
              >
                Add Resources
              </button>
            )}
            {onExtendDeadline && (
              <button
                onClick={onExtendDeadline}
                className="px-4 py-2 rounded-lg bg-surface-2 text-text-secondary text-sm hover:bg-surface-3 transition-colors"
              >
                Extend Deadline
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI FORECAST WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniForecastWidget - Compact forecast for dashboard
 */
export function MiniForecastWidget({
  forecast,
  sprintName,
  onClick,
  className = '',
}) {
  if (!forecast) return null;
  
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
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          ${forecast.isOnTrack 
            ? 'bg-success-500/10'
            : forecast.isAtRisk
            ? 'bg-error-500/10'
            : 'bg-warning-500/10'
          }
        `}>
          {forecast.isOnTrack ? (
            <TrendingUp className="w-4 h-4 text-success-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-warning-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-text-primary">{sprintName}</div>
          <div className="text-xs text-text-tertiary">{forecast.daysRemaining} days left</div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
      </div>
      
      {/* Mini progress */}
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            forecast.isOnTrack ? 'bg-success-500' : forecast.isAtRisk ? 'bg-error-500' : 'bg-warning-500'
          }`}
          style={{ width: `${forecast.projectedCompletion}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-text-tertiary">{forecast.currentCompletion}% done</span>
        <span className={`font-medium ${
          forecast.isOnTrack ? 'text-success-400' : forecast.isAtRisk ? 'text-error-400' : 'text-warning-400'
        }`}>
          → {forecast.projectedCompletion}%
        </span>
      </div>
    </button>
  );
}

export default CompletionForecast;
