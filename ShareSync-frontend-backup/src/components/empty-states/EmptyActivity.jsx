// src/components/empty-states/EmptyActivity.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Empty Activity Feed
// ═══════════════════════════════════════════════════════════════════════════════
//
// No activity yet? That's the beginning of a story!
// Frame this as potential, not absence.
//
// Key messaging:
// - "Your story starts now"
// - "Every legend has a first chapter"
// - Encouraging first action
// - Show what activities will appear
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Sparkles, 
  Zap,
  Clock,
  CheckCircle2,
  MessageSquare,
  GitCommit,
  ArrowRight,
  Play,
  BookOpen,
  Star,
  Rocket,
} from 'lucide-react';
import EmptyState from './EmptyState';
import { ActivityIllustration } from './EmptyStateIllustration';
import { useMomentumContext } from '../../contexts/MomentumContext';

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TYPE PREVIEWS
// ═══════════════════════════════════════════════════════════════════════════════
const ActivityTypePreviews = () => {
  const activityTypes = [
    { icon: CheckCircle2, label: 'Tasks completed', color: 'text-success-400' },
    { icon: Rocket, label: 'Projects shipped', color: 'text-brand-400' },
    { icon: MessageSquare, label: 'Comments', color: 'text-cyan-400' },
    { icon: GitCommit, label: 'Milestones', color: 'text-warning-400' },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6"
    >
      <div className="text-xs text-text-tertiary mb-3 text-center">
        Activities that will appear here
      </div>
      
      <div className="flex flex-wrap justify-center gap-3">
        {activityTypes.map((type, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-white/[0.06]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <type.icon className={`w-4 h-4 ${type.color}`} />
            <span className="text-sm text-text-secondary">{type.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE PREVIEW (skeleton)
// ═══════════════════════════════════════════════════════════════════════════════
const TimelinePreview = () => {
  const placeholders = [
    { delay: 0.3, width: '70%' },
    { delay: 0.4, width: '55%' },
    { delay: 0.5, width: '65%' },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-8 max-w-sm mx-auto"
    >
      <div className="relative pl-6">
        {/* Timeline line */}
        <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-brand-500/50 via-white/[0.1] to-transparent" />
        
        {/* Timeline items */}
        {placeholders.map((item, i) => (
          <motion.div
            key={i}
            className="relative pb-6 last:pb-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: item.delay }}
          >
            {/* Dot */}
            <div className={`
              absolute left-0 w-4 h-4 rounded-full border-2
              ${i === 0 
                ? 'bg-brand-500 border-brand-500' 
                : 'bg-surface-1 border-white/[0.1]'
              }
            `}>
              {i === 0 && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-brand-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            
            {/* Content */}
            <div className="ml-4">
              <div 
                className={`h-3 rounded ${i === 0 ? 'bg-brand-500/20' : 'bg-surface-2'}`}
                style={{ width: item.width }}
              />
              <div className="h-2 w-16 rounded bg-surface-2 mt-2 opacity-50" />
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* First entry hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 text-center"
      >
        <span className="text-xs text-text-tertiary">
          Your first activity will appear here ✨
        </span>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK START ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const QuickStartActions = ({ onCreateTask, onStartFocus, onViewTutorial }) => {
  const actions = [
    { icon: CheckCircle2, label: 'Complete a task', action: onCreateTask, primary: true },
    { icon: Play, label: 'Start focus session', action: onStartFocus },
    { icon: BookOpen, label: 'Quick tutorial', action: onViewTutorial },
  ].filter(a => a.action);
  
  if (actions.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-8"
    >
      <div className="text-xs text-text-tertiary mb-3 text-center">
        Get started now
      </div>
      
      <div className="flex flex-wrap justify-center gap-3">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.action}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl
              transition-all duration-200
              ${action.primary 
                ? 'bg-brand-600 text-white hover:bg-brand-500' 
                : 'bg-surface-2 border border-white/[0.06] text-text-secondary hover:text-text-primary hover:bg-surface-3'
              }
            `}
          >
            <action.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INSPIRATIONAL QUOTE
// ═══════════════════════════════════════════════════════════════════════════════
const quotes = [
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
];

const InspirationalQuote = () => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
      className="mt-8 pt-6 border-t border-white/[0.06] text-center"
    >
      <p className="text-sm text-text-secondary italic">"{quote.text}"</p>
      <p className="text-xs text-text-tertiary mt-1">— {quote.author}</p>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmptyActivity({
  // Context
  userName = '',
  
  // Actions
  onCreateTask,
  onStartFocus,
  onViewTutorial,
  
  // Display options
  showActivityTypes = true,
  showTimeline = true,
  showQuote = true,
  variant = 'illustrated', // 'minimal' | 'illustrated' | 'animated'
  className = '',
}) {
  const { glowLevel, isFireMode } = useMomentumContext();
  
  // Generate personalized title
  const title = userName 
    ? `${userName}, your story starts now`
    : "Your story starts now";
    
  const description = "Every legend has a first chapter. Complete a task, ship a project, or start a focus session to begin writing yours. Your activity feed will chronicle your journey.";
  
  // Simple minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Activity className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
        <p className="text-sm text-text-secondary mb-1">No activity yet</p>
        <p className="text-xs text-text-tertiary">
          Complete tasks to start your journey
        </p>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <EmptyState
        illustration={ActivityIllustration}
        title={title}
        description={description}
        variant={variant}
        size="default"
        accentColor={isFireMode ? 'energy' : 'brand'}
      >
        {/* Activity type previews */}
        {showActivityTypes && <ActivityTypePreviews />}
        
        {/* Timeline preview */}
        {showTimeline && <TimelinePreview />}
        
        {/* Quick start actions */}
        <QuickStartActions 
          onCreateTask={onCreateTask}
          onStartFocus={onStartFocus}
          onViewTutorial={onViewTutorial}
        />
        
        {/* Inspirational quote */}
        {showQuote && <InspirationalQuote />}
      </EmptyState>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT VARIANT (for sidebars, widgets)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyActivityCompact({ onCreateTask, className = '' }) {
  return (
    <div className={`p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-text-primary mb-1">
            No activity yet
          </h4>
          <p className="text-xs text-text-tertiary mb-3">
            Your journey begins with the first task
          </p>
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-500 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Start now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEED VARIANT (for activity feeds/streams)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyActivityFeed({ 
  message = 'No activity in this feed',
  suggestion = 'Activity will appear here as you work',
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mb-4"
      >
        <Clock className="w-6 h-6 text-text-tertiary" />
      </motion.div>
      <p className="text-sm text-text-secondary mb-1">{message}</p>
      <p className="text-xs text-text-tertiary">{suggestion}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT ACTIVITY VARIANT
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyProjectActivity({ projectName, onAddTask, className = '' }) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="relative inline-block mb-4">
        <div className="w-14 h-14 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <GitCommit className="w-7 h-7 text-brand-400" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-surface-1 border-2 border-surface-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Star className="w-3 h-3 text-warning-500" />
        </motion.div>
      </div>
      
      <h4 className="text-sm font-medium text-text-primary mb-1">
        {projectName ? `${projectName} is brand new` : 'Fresh project'}
      </h4>
      <p className="text-xs text-text-tertiary mb-4 max-w-xs mx-auto">
        Complete tasks and milestones to see the project's story unfold
      </p>
      
      {onAddTask && (
        <button
          onClick={onAddTask}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors text-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          Add first task
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER ACTIVITY VARIANT (profile page)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyUserActivity({ isOwnProfile = true, userName = '', className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4"
      >
        <Sparkles className="w-8 h-8 text-brand-400" />
      </motion.div>
      
      <h4 className="text-lg font-medium text-text-primary mb-2">
        {isOwnProfile 
          ? "Your activity feed awaits"
          : `${userName || 'This user'} hasn't started yet`
        }
      </h4>
      
      <p className="text-sm text-text-secondary max-w-md mx-auto">
        {isOwnProfile 
          ? "Every task you complete, every project you ship, and every milestone you reach will be recorded here. Start building your legend!"
          : "Once they start shipping tasks and projects, their activity will appear here."
        }
      </p>
    </div>
  );
}
