// src/components/empty-states/EmptyActivity.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4.1: Empty States That Sell - Empty Activity Feed
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Sparkles, 
  Users,
  User,
  Zap,
  Clock,
  CheckCircle2,
  MessageSquare,
  GitCommit,
  Star,
} from 'lucide-react';
import EmptyState from './EmptyState';
import { ActivityIllustration } from './EmptyStateIllustration';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT (With Team vs Solo toggle)
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmptyActivity({
  onInviteTeammates,
  className = '',
}) {
  const [isSoloMode, setIsSoloMode] = useState(false);

  return (
    <div className={className}>
      <motion.div 
        key={isSoloMode ? 'solo' : 'team'}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto"
      >
        <div className="w-20 h-20 rounded-3xl bg-surface-2 border border-white/[0.08] shadow-xl flex items-center justify-center mb-8">
          {isSoloMode ? (
            <Sparkles className="w-10 h-10 text-brand-400" />
          ) : (
            <Users className="w-10 h-10 text-cyan-400" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-3">
          {isSoloMode ? "Flying solo? That's cool." : "Your team's mission feed"}
        </h2>
        
        <p className="text-text-secondary text-base mb-8">
          {isSoloMode 
            ? "ShareSync works great for solo builders too. Your momentum is what matters." 
            : "When teammates ship work, you'll see it here. Invite your crew to get started."}
        </p>

        {!isSoloMode && onInviteTeammates && (
          <button 
            onClick={onInviteTeammates}
            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white mb-8 hover:scale-105 transition-transform"
          >
            <Users className="w-4 h-4" />
            Invite Teammates
          </button>
        )}

        {/* The Toggle Link */}
        <button
          onClick={() => setIsSoloMode(!isSoloMode)}
          className="flex items-center gap-2 text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors py-2 px-4 rounded-lg hover:bg-surface-2"
        >
          {isSoloMode ? (
            <><Users className="w-4 h-4" /> Switch back to team view</>
          ) : (
            <><User className="w-4 h-4" /> Show solo achievements instead of team feed</>
          )}
        </button>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT & INLINE EXPORTS 
// ═══════════════════════════════════════════════════════════════════════════════
export function EmptyActivityCompact({ onCreateTask, className = '' }) {
  return (
    <div className={`p-4 rounded-xl card-surface border border-white/[0.06] ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-text-primary mb-1">No activity yet</h4>
          <p className="text-xs text-text-tertiary mb-3">Your journey begins with the first task</p>
          {onCreateTask && (
            <button onClick={onCreateTask} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-white text-xs font-medium transition-all hover:scale-105">
              <Zap className="w-3.5 h-3.5" /> Start now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyActivityFeed({ message = 'No activity in this feed', suggestion = 'Activity will appear here as you work', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mb-4">
        <Clock className="w-6 h-6 text-text-tertiary" />
      </motion.div>
      <p className="text-sm text-text-secondary mb-1">{message}</p>
      <p className="text-xs text-text-tertiary">{suggestion}</p>
    </div>
  );
}

export function EmptyProjectActivity({ projectName, onAddTask, className = '' }) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="relative inline-block mb-4">
        <div className="w-14 h-14 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <GitCommit className="w-7 h-7 text-brand-400" />
        </div>
      </div>
      <h4 className="text-sm font-medium text-text-primary mb-1">{projectName ? `${projectName} is brand new` : 'Fresh project'}</h4>
      <p className="text-xs text-text-tertiary mb-4 max-w-xs mx-auto">Complete moves and milestones to see the project's story unfold</p>
      {onAddTask && (
        <button onClick={onAddTask} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors text-sm">
          <CheckCircle2 className="w-4 h-4" /> Add first move
        </button>
      )}
    </div>
  );
}

export function EmptyUserActivity({ isOwnProfile = true, userName = '', className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-brand-400" />
      </motion.div>
      <h4 className="text-lg font-medium text-text-primary mb-2">{isOwnProfile ? "Your activity feed awaits" : `${userName || 'This user'} hasn't started yet`}</h4>
      <p className="text-sm text-text-secondary max-w-md mx-auto">{isOwnProfile ? "Every task you complete, every project you ship, and every milestone you reach will be recorded here. Start building your legend!" : "Once they start shipping tasks and projects, their activity will appear here."}</p>
    </div>
  );
}
