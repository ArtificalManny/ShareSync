// src/components/ceremony/TeamCelebration.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// CEREMONY MOMENTS: Team Celebrations
// Shared celebrations for team achievements
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  Users, Trophy, Rocket, Sparkles, Calendar,
  PartyPopper, Award, ChevronRight, Clock, X
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CHAMPAGNE POP ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

function ChampagnePop({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Champagne bottle */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 animate-champagne-bottle">
        <div className="text-8xl">🍾</div>
      </div>
      
      {/* Bubbles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-yellow-400/60 animate-bubble"
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: '25%',
            animationDelay: `${Math.random() * 1000}ms`,
            animationDuration: `${2000 + Math.random() * 1000}ms`,
          }}
        />
      ))}
      
      {/* Confetti burst */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={`confetti-${i}`}
          className="absolute w-2 h-2 animate-confetti-burst"
          style={{
            left: '50%',
            top: '25%',
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#7C3AED', '#F59E0B'][i % 5],
            transform: `rotate(${Math.random() * 360}deg)`,
            animationDelay: `${500 + Math.random() * 500}ms`,
            '--x': `${(Math.random() - 0.5) * 400}px`,
            '--y': `${Math.random() * 300 + 100}px`,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM MEMBER CELEBRATION AVATAR
// ═══════════════════════════════════════════════════════════════════════════════

function CelebrationAvatar({ member, reaction, delay = 0 }) {
  return (
    <div 
      className="flex flex-col items-center animate-in zoom-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
          {member.avatar ? (
            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-medium text-text-secondary">
              {member.name?.charAt(0)}
            </span>
          )}
        </div>
        {reaction && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface-0 flex items-center justify-center text-sm animate-bounce">
            {reaction}
          </div>
        )}
      </div>
      <span className="text-xs text-text-tertiary mt-1 truncate max-w-[60px]">
        {member.name?.split(' ')[0]}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT SHIP TEAM CELEBRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ProjectShipTeamCelebration - Full team celebration for project ships
 */
export function ProjectShipTeamCelebration({
  project,
  teamMembers = [],
  onClose,
  onScheduleRetro,
}) {
  const [showChampagne, setShowChampagne] = useState(true);
  const reactions = ['🎉', '��', '🚀', '💪', '⭐', '🔥'];
  
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center overflow-hidden">
      {showChampagne && <ChampagnePop onComplete={() => setShowChampagne(false)} />}
      
      <div className="text-center max-w-2xl p-8 animate-in fade-in duration-1000">
        {/* Title */}
        <div className="text-5xl font-bold text-white mb-4">
          🚀 Project Shipped! ��
        </div>
        
        <div className="text-2xl text-text-secondary mb-8">
          "{project?.name || 'Project'}"
        </div>
        
        {/* Team avatars */}
        {teamMembers.length > 0 && (
          <div className="mb-8">
            <div className="text-sm text-text-tertiary mb-4">Team celebration!</div>
            <div className="flex justify-center gap-4 flex-wrap">
              {teamMembers.slice(0, 8).map((member, idx) => (
                <CelebrationAvatar
                  key={member.id}
                  member={member}
                  reaction={reactions[idx % reactions.length]}
                  delay={idx * 100}
                />
              ))}
              {teamMembers.length > 8 && (
                <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-sm text-text-tertiary">
                  +{teamMembers.length - 8}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Team badge earned */}
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-500/20 text-brand-400 mb-8">
          <Award className="w-5 h-5" />
          <span className="font-medium">Team Badge Earned!</span>
        </div>
        
        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onScheduleRetro}
            className="
              px-6 py-3 rounded-xl
              bg-surface-2 text-text-secondary
              hover:bg-surface-3 transition-colors
              flex items-center gap-2
            "
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Retro</span>
          </button>
          
          <button
            onClick={onClose}
            className="
              px-8 py-3 rounded-xl
              bg-gradient-to-r from-brand-500 to-purple-500
              text-white font-bold
              hover:from-brand-400 hover:to-purple-400
              transition-all
            "
          >
            🎉 Celebrate!
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT COMPLETE CELEBRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SprintCompleteCelebration - Celebration when sprint is completed
 */
export function SprintCompleteCelebration({
  sprint,
  stats,
  teamMembers = [],
  onScheduleRetro,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-surface-0 border border-brand-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-brand-500/20 to-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-text-primary">
                Sprint Complete! 🎯
              </div>
              <div className="text-sm text-text-tertiary">
                {sprint?.name}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-2 rounded-lg hover:bg-white/10 text-text-tertiary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-xl bg-surface-1">
              <div className="text-2xl font-bold text-brand-400">
                {stats?.tasksCompleted || 0}
              </div>
              <div className="text-xs text-text-tertiary">Tasks Done</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-surface-1">
              <div className="text-2xl font-bold text-success-400">
                {stats?.onTime || 100}%
              </div>
              <div className="text-xs text-text-tertiary">On Time</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-surface-1">
              <div className="text-2xl font-bold text-warning-400">
                {stats?.totalXP || 0}
              </div>
              <div className="text-xs text-text-tertiary">Team XP</div>
            </div>
          </div>
          
          {/* Team */}
          {teamMembers.length > 0 && (
            <div className="mb-6">
              <div className="text-sm text-text-tertiary mb-3">Team</div>
              <div className="flex gap-2 flex-wrap">
                {teamMembers.map(member => (
                  <div
                    key={member.id}
                    className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden"
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium text-text-secondary">
                        {member.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Schedule retro */}
          <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-brand-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">
                  Schedule Retro?
                </div>
                <div className="text-xs text-text-tertiary">
                  15-min team reflection session
                </div>
              </div>
              <button
                onClick={onScheduleRetro}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
              >
                Schedule
              </button>
            </div>
          </div>
          
          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM NOTIFICATION TOAST
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TeamShipNotification - Toast when teammate ships
 */
export function TeamShipNotification({
  user,
  task,
  tier,
  onClap,
  onDismiss,
}) {
  const [hasClapped, setHasClapped] = useState(false);
  
  const handleClap = () => {
    setHasClapped(true);
    onClap?.();
  };
  
  return (
    <div className="fixed bottom-6 right-6 w-80 z-40 animate-in slide-in-from-right duration-300">
      <div className="bg-surface-0 border border-brand-500/30 rounded-xl shadow-xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-text-secondary">
                  {user.name?.charAt(0)}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm text-text-primary">
                <span className="font-medium">{user.name}</span> shipped!
              </div>
              <div className="text-xs text-text-tertiary truncate">
                {task?.title}
              </div>
            </div>
            
            <button
              onClick={onDismiss}
              className="p-1 rounded hover:bg-white/10 text-text-tertiary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleClap}
            disabled={hasClapped}
            className={`
              w-full mt-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${hasClapped 
                ? 'bg-brand-500/20 text-brand-400' 
                : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
              }
            `}
          >
            {hasClapped ? '👏 Clapped!' : '👏 Send clap'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectShipTeamCelebration;
