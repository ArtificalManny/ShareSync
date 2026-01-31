// src/components/social/AsyncStandup/TeamDigest.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL FABRIC: Async Standup - Team Digest
// "Here's what the team is working on" - Daily digest at 9am
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  Users, Target, AlertTriangle, Clock, ChevronRight,
  ChevronDown, Sparkles, CheckCircle2, Calendar, Zap
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM MEMBER UPDATE CARD
// ═══════════════════════════════════════════════════════════════════════════════

function MemberUpdateCard({
  member,
  update,
  onViewProfile,
  isExpanded,
  onToggle,
}) {
  const hasBlocker = update?.blocker;
  
  return (
    <div className={`
      rounded-xl border transition-all duration-200
      ${hasBlocker 
        ? 'bg-warning-500/5 border-warning-500/20' 
        : 'bg-surface-1 border-white/[0.06]'
      }
    `}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center">
            {member.avatar ? (
              <img src={member.avatar} alt="" className="w-full h-full rounded-full" />
            ) : (
              <span className="text-sm font-medium text-text-secondary">
                {member.name?.charAt(0)}
              </span>
            )}
          </div>
          {hasBlocker && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning-500 flex items-center justify-center">
              <AlertTriangle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{member.name}</span>
            {update?.tasks?.length > 0 && (
              <span className="text-xs text-text-tertiary">
                · {update.tasks.length} task{update.tasks.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {update?.focus ? (
            <div className="text-xs text-text-secondary truncate">
              {update.focus}
            </div>
          ) : (
            <div className="text-xs text-text-tertiary italic">
              No update shared yet
            </div>
          )}
        </div>
        
        {/* Expand icon */}
        <ChevronDown className={`
          w-4 h-4 text-text-tertiary transition-transform
          ${isExpanded ? 'rotate-180' : ''}
        `} />
      </button>
      
      {/* Expanded content */}
      {isExpanded && update && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06] mt-0">
          {/* Focus */}
          {update.focus && (
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">
                Focus
              </div>
              <div className="text-sm text-text-primary">
                {update.focus}
              </div>
            </div>
          )}
          
          {/* Tasks */}
          {update.tasks?.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-2">
                Tasks
              </div>
              <div className="space-y-1">
                {update.tasks.map((task, idx) => (
                  <div 
                    key={task.id || idx}
                    className="flex items-center gap-2 text-sm text-text-secondary"
                  >
                    <Target className="w-3 h-3 text-brand-400" />
                    <span>{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Blocker */}
          {update.blocker && (
            <div className="mt-3 p-3 rounded-lg bg-warning-500/10">
              <div className="flex items-center gap-2 text-xs text-warning-500 mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Blocked</span>
              </div>
              <div className="text-sm text-text-secondary">
                {update.blocker}
              </div>
            </div>
          )}
          
          {/* Timestamp */}
          {update.timestamp && (
            <div className="mt-3 text-[10px] text-text-tertiary flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Updated {formatTime(update.timestamp)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKERS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

function BlockersSummary({ blockers }) {
  if (blockers.length === 0) return null;
  
  return (
    <div className="p-4 rounded-xl bg-warning-500/10 border border-warning-500/30">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-warning-500" />
        <span className="text-sm font-medium text-warning-500">
          {blockers.length} Blocker{blockers.length !== 1 ? 's' : ''} Today
        </span>
      </div>
      
      <div className="space-y-2">
        {blockers.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <div className="w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px]">{item.member.name?.charAt(0)}</span>
            </div>
            <div>
              <span className="font-medium text-text-primary">{item.member.name}:</span>
              <span className="text-text-secondary ml-1">{item.blocker}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TEAM DIGEST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TeamDigest - Daily digest of team updates
 */
export function TeamDigest({
  updates = [], // [{ member, update }]
  date = new Date(),
  onViewMember,
  className = '',
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  
  // Process updates
  const { responded, pending, blockers } = useMemo(() => {
    const responded = updates.filter(u => u.update);
    const pending = updates.filter(u => !u.update);
    const blockers = updates
      .filter(u => u.update?.blocker)
      .map(u => ({ member: u.member, blocker: u.update.blocker }));
    
    return { responded, pending, blockers };
  }, [updates]);
  
  const displayUpdates = showAll ? responded : responded.slice(0, 5);
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-brand-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">
                Team Digest
              </div>
              <div className="text-sm text-text-tertiary flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-400">
              {responded.length}/{updates.length}
            </div>
            <div className="text-xs text-text-tertiary">checked in</div>
          </div>
        </div>
      </div>
      
      {/* Blockers summary */}
      {blockers.length > 0 && (
        <div className="p-4 border-b border-white/[0.06]">
          <BlockersSummary blockers={blockers} />
        </div>
      )}
      
      {/* Team updates */}
      <div className="p-4 space-y-3">
        {displayUpdates.length > 0 ? (
          <>
            {displayUpdates.map(({ member, update }) => (
              <MemberUpdateCard
                key={member.id}
                member={member}
                update={update}
                isExpanded={expandedId === member.id}
                onToggle={() => setExpandedId(
                  expandedId === member.id ? null : member.id
                )}
                onViewProfile={() => onViewMember?.(member)}
              />
            ))}
            
            {responded.length > 5 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-sm text-brand-400 hover:text-brand-300 flex items-center justify-center gap-1"
              >
                <span>Show {responded.length - 5} more</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="py-8 text-center">
            <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <div className="text-sm text-text-tertiary">
              No updates yet today
            </div>
          </div>
        )}
      </div>
      
      {/* Pending section */}
      {pending.length > 0 && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-xl bg-surface-1 border border-white/[0.06]">
            <div className="text-xs text-text-tertiary mb-2">
              Waiting for updates from:
            </div>
            <div className="flex flex-wrap gap-2">
              {pending.map(({ member }) => (
                <div
                  key={member.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-2"
                >
                  <div className="w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center">
                    <span className="text-[10px] text-text-tertiary">
                      {member.name?.charAt(0)}
                    </span>
                  </div>
                  <span className="text-xs text-text-secondary">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI DIGEST PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MiniDigestPreview - Compact preview for dashboard
 */
export function MiniDigestPreview({
  updates = [],
  onViewFull,
  className = '',
}) {
  const respondedCount = updates.filter(u => u.update).length;
  const blockerCount = updates.filter(u => u.update?.blocker).length;
  
  return (
    <button
      onClick={onViewFull}
      className={`
        w-full flex items-center gap-3 p-4 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 transition-colors
        text-left group
        ${className}
      `}
    >
      <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
        <Users className="w-5 h-5 text-brand-400" />
      </div>
      
      <div className="flex-1">
        <div className="text-sm font-medium text-text-primary">
          Team Digest
        </div>
        <div className="text-xs text-text-tertiary flex items-center gap-2">
          <span>{respondedCount}/{updates.length} checked in</span>
          {blockerCount > 0 && (
            <span className="text-warning-500">· {blockerCount} blocker{blockerCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      
      {/* Team avatars */}
      <div className="flex -space-x-2">
        {updates.slice(0, 4).map(({ member }) => (
          <div
            key={member.id}
            className="w-6 h-6 rounded-full bg-surface-2 border border-surface-1 flex items-center justify-center"
          >
            {member.avatar ? (
              <img src={member.avatar} alt="" className="w-full h-full rounded-full" />
            ) : (
              <span className="text-[10px]">{member.name?.charAt(0)}</span>
            )}
          </div>
        ))}
      </div>
      
      <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

export default TeamDigest;
