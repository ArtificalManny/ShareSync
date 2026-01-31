// src/components/meaning/WhyChain.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEANING LAYER: The "Why" Chain
// Shows the purpose connection: Task → Objective → Goal → Vision
// Every piece of work connects to something bigger
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, Target, Flag, Rocket, Sparkles, 
  Eye, Zap, ArrowRight, ChevronDown, ChevronUp,
  CheckCircle2, Circle
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CHAIN LEVEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CHAIN_LEVELS = {
  vision: {
    label: 'Vision',
    icon: Eye,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    glowColor: 'shadow-purple-500/20',
    description: 'The ultimate purpose',
  },
  goal: {
    label: 'Goal',
    icon: Flag,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    glowColor: 'shadow-cyan-500/20',
    description: 'Major milestone',
  },
  objective: {
    label: 'Objective',
    icon: Target,
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/10',
    borderColor: 'border-brand-500/30',
    glowColor: 'shadow-brand-500/20',
    description: 'Key result',
  },
  task: {
    label: 'Task',
    icon: CheckCircle2,
    color: 'text-success-400',
    bgColor: 'bg-success-500/10',
    borderColor: 'border-success-500/30',
    glowColor: 'shadow-success-500/20',
    description: 'Current work',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHAIN NODE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ChainNode({ 
  level, 
  title, 
  subtitle,
  progress = 0,
  isActive = false,
  isCompleted = false,
  onClick,
  showProgress = true,
}) {
  const config = CHAIN_LEVELS[level];
  const Icon = config.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-3 p-3 rounded-xl
        border transition-all duration-300
        ${isActive 
          ? `${config.bgColor} ${config.borderColor} shadow-lg ${config.glowColor}` 
          : 'bg-surface-1 border-white/[0.06] hover:bg-surface-2 hover:border-white/[0.1]'
        }
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        group
      `}
    >
      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center
        ${isActive ? config.bgColor : 'bg-surface-2'}
        ${isCompleted ? 'bg-success-500/20' : ''}
        transition-colors duration-300
      `}>
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-success-500" />
        ) : (
          <Icon className={`w-5 h-5 ${isActive ? config.color : 'text-text-tertiary'}`} />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className={`
            text-[10px] font-medium uppercase tracking-wider
            ${isActive ? config.color : 'text-text-tertiary'}
          `}>
            {config.label}
          </span>
          {showProgress && progress > 0 && (
            <span className="text-[10px] text-text-tertiary">
              {Math.round(progress)}%
            </span>
          )}
        </div>
        <div className={`
          text-sm font-medium truncate
          ${isActive ? 'text-text-primary' : 'text-text-secondary'}
        `}>
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-text-tertiary truncate mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      {showProgress && progress > 0 && (
        <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-surface-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-success-500' : isActive ? 'bg-brand-500' : 'bg-text-tertiary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAIN CONNECTOR
// ═══════════════════════════════════════════════════════════════════════════════

function ChainConnector({ isActive = false, direction = 'horizontal' }) {
  if (direction === 'vertical') {
    return (
      <div className="flex justify-center py-1">
        <div className={`
          w-0.5 h-6 rounded-full
          ${isActive ? 'bg-brand-500/50' : 'bg-white/[0.1]'}
          transition-colors duration-300
        `} />
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center px-1">
      <ChevronRight className={`
        w-4 h-4
        ${isActive ? 'text-brand-400' : 'text-text-tertiary'}
        transition-colors duration-300
      `} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WHY CHAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WhyChain - Shows the purpose hierarchy for a task
 * 
 * @param {Object} props
 * @param {Object} props.task - Current task
 * @param {Object} props.objective - Parent objective
 * @param {Object} props.goal - Parent goal
 * @param {Object} props.vision - Project/org vision
 * @param {string} props.variant - 'horizontal' | 'vertical' | 'compact'
 * @param {boolean} props.showProgress - Show progress bars
 * @param {Function} props.onNodeClick - Callback when node clicked
 */
export function WhyChain({
  task,
  objective,
  goal,
  vision,
  variant = 'horizontal',
  showProgress = true,
  onNodeClick,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);
  
  // Build chain data
  const chain = useMemo(() => {
    const items = [];
    
    if (vision) {
      items.push({
        level: 'vision',
        ...vision,
        isCompleted: vision.progress >= 100,
      });
    }
    
    if (goal) {
      items.push({
        level: 'goal',
        ...goal,
        isCompleted: goal.progress >= 100,
      });
    }
    
    if (objective) {
      items.push({
        level: 'objective',
        ...objective,
        isCompleted: objective.progress >= 100,
      });
    }
    
    if (task) {
      items.push({
        level: 'task',
        ...task,
        isActive: true,
        isCompleted: task.status === 'completed',
      });
    }
    
    return items;
  }, [task, objective, goal, vision]);
  
  // Compact variant - just shows text summary
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 text-xs text-text-tertiary ${className}`}>
        <Sparkles className="w-3 h-3 text-brand-400" />
        <span>Contributing to:</span>
        {objective && (
          <span className="text-text-secondary font-medium">{objective.title}</span>
        )}
        {goal && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-text-secondary">{goal.title}</span>
          </>
        )}
      </div>
    );
  }
  
  // Vertical variant
  if (variant === 'vertical') {
    return (
      <div className={`space-y-0 ${className}`}>
        {chain.map((item, idx) => (
          <React.Fragment key={item.level}>
            <ChainNode
              level={item.level}
              title={item.title}
              subtitle={item.subtitle}
              progress={item.progress}
              isActive={item.isActive}
              isCompleted={item.isCompleted}
              showProgress={showProgress}
              onClick={() => onNodeClick?.(item)}
            />
            {idx < chain.length - 1 && (
              <ChainConnector 
                direction="vertical" 
                isActive={item.isActive || chain[idx + 1]?.isActive}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
  
  // Horizontal variant (default)
  return (
    <div className={`flex items-center gap-1 overflow-x-auto ${className}`}>
      {chain.map((item, idx) => (
        <React.Fragment key={item.level}>
          <ChainNode
            level={item.level}
            title={item.title}
            subtitle={item.subtitle}
            progress={item.progress}
            isActive={item.isActive}
            isCompleted={item.isCompleted}
            showProgress={showProgress}
            onClick={() => onNodeClick?.(item)}
          />
          {idx < chain.length - 1 && (
            <ChainConnector isActive={item.isActive || chain[idx + 1]?.isActive} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI WHY BADGE - For task cards
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniWhyBadge - Small badge showing what task contributes to
 */
export function MiniWhyBadge({ 
  objective, 
  goal,
  onClick,
  className = '',
}) {
  if (!objective && !goal) return null;
  
  const displayText = objective?.title || goal?.title || 'Project Goal';
  
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full
        bg-brand-500/10 border border-brand-500/20
        hover:bg-brand-500/20 transition-colors
        ${className}
      `}
    >
      <Target className="w-3 h-3 text-brand-400" />
      <span className="text-[10px] text-brand-400 truncate max-w-[120px]">
        {displayText}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHY CHAIN TOOLTIP - Hover preview
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WhyChainTooltip - Shows full chain on hover
 */
export function WhyChainTooltip({
  task,
  objective,
  goal,
  vision,
  children,
  className = '',
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      {showTooltip && (objective || goal || vision) && (
        <div className="
          absolute bottom-full left-0 mb-2 z-50
          p-4 rounded-xl
          bg-surface-1 border border-white/[0.08]
          shadow-2xl
          animate-in fade-in slide-in-from-bottom-2 duration-200
          min-w-[300px]
        ">
          <div className="text-xs font-medium text-text-tertiary mb-3 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-brand-400" />
            This contributes to
          </div>
          
          <WhyChain
            task={task}
            objective={objective}
            goal={goal}
            vision={vision}
            variant="vertical"
            showProgress={false}
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRIBUTION SUMMARY - Text description of impact
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ContributionSummary - Text summary of how task contributes
 */
export function ContributionSummary({
  task,
  objective,
  goal,
  xpReward = 0,
  className = '',
}) {
  if (!objective && !goal) {
    return (
      <div className={`text-xs text-text-tertiary ${className}`}>
        Complete to earn {xpReward > 0 ? `+${xpReward} XP` : 'progress'}
      </div>
    );
  }
  
  return (
    <div className={`text-xs text-text-tertiary ${className}`}>
      <span>This task </span>
      {objective && (
        <>
          <span className="text-brand-400">advances "{objective.title}"</span>
          {goal && <span> toward </span>}
        </>
      )}
      {goal && (
        <span className="text-cyan-400">"{goal.title}"</span>
      )}
      {xpReward > 0 && (
        <span className="text-success-400 font-medium"> (+{xpReward} XP)</span>
      )}
    </div>
  );
}

export default WhyChain;
