// src/components/meaning/WeeklyMeaningReport.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// MEANING LAYER: Weekly Meaning Report
// Summarizes the impact of user's work over the past week
// "This week, you moved ShareSync 12% closer to launch..."
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  X, ChevronRight, TrendingUp, Users, Clock, Zap,
  Trophy, Target, Flame, Sparkles, ArrowUp, ArrowDown,
  Calendar, Star, Unlock, CheckCircle2, Gift
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  trend, 
  trendValue,
  color = 'brand',
}) {
  const colorClasses = {
    brand: { bg: 'bg-brand-500/10', text: 'text-brand-400', icon: 'text-brand-400' },
    success: { bg: 'bg-success-500/10', text: 'text-success-400', icon: 'text-success-400' },
    warning: { bg: 'bg-warning-500/10', text: 'text-warning-500', icon: 'text-warning-500' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', icon: 'text-cyan-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'text-purple-400' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'text-orange-400' },
  };
  
  const colors = colorClasses[color] || colorClasses.brand;
  
  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        {trend && (
          <div className={`
            flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
            ${trend === 'up' ? 'bg-success-500/10 text-success-400' : 'bg-error-500/10 text-error-400'}
          `}>
            {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${colors.text} mb-1`}>
        {value}
      </div>
      <div className="text-xs text-text-tertiary">{label}</div>
      {subtext && (
        <div className="text-[10px] text-text-tertiary mt-1 opacity-70">{subtext}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT ROW
// ═══════════════════════════════════════════════════════════════════════════════

function AchievementRow({ icon: Icon, title, description, color = 'brand' }) {
  const colorClasses = {
    brand: 'text-brand-400 bg-brand-500/10',
    success: 'text-success-400 bg-success-500/10',
    warning: 'text-warning-500 bg-warning-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  };
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2/50 hover:bg-surface-2 transition-colors">
      <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{title}</div>
        <div className="text-xs text-text-tertiary truncate">{description}</div>
      </div>
      <CheckCircle2 className="w-4 h-4 text-success-500" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WEEKLY MEANING REPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WeeklyMeaningReport - Modal showing weekly impact summary
 */
export function WeeklyMeaningReport({
  isOpen,
  onClose,
  data = {},
  userName = 'there',
}) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Destructure data with defaults
  const {
    weekNumber = 1,
    dateRange = 'Jan 20 - Jan 26',
    projectName = 'ShareSync',
    
    // Core stats
    tasksCompleted = 0,
    xpEarned = 0,
    hoursWorked = 0,
    streakDays = 0,
    
    // Impact stats
    progressContribution = 0, // % moved toward goal
    peopleUnblocked = 0,
    timeSaved = 0, // hours saved for others
    
    // Comparisons
    tasksVsLastWeek = 0, // percentage change
    xpVsLastWeek = 0,
    
    // Identity/growth
    topSkill = null, // { name, growth }
    archetypeTitle = 'Builder',
    reputationTrait = 'Fast Shipper',
    
    // Highlights
    biggestShip = null, // { title, xp, project }
    achievements = [], // [{ icon, title, description }]
    
    // Goals
    goalsProgress = [], // [{ name, current, target }]
  } = data;
  
  // Generate summary message
  const summaryMessage = useMemo(() => {
    const parts = [];
    
    if (progressContribution > 0) {
      parts.push(`moved ${projectName} ${progressContribution}% closer to launch`);
    }
    
    if (peopleUnblocked > 0) {
      parts.push(`unblocked ${peopleUnblocked} teammate${peopleUnblocked !== 1 ? 's' : ''}`);
    }
    
    if (timeSaved > 0) {
      parts.push(`saved ~${timeSaved} hours of waiting`);
    }
    
    if (parts.length === 0) {
      return `You completed ${tasksCompleted} tasks and earned ${xpEarned} XP.`;
    }
    
    return `You ${parts.join(' and ')}.`;
  }, [projectName, progressContribution, peopleUnblocked, timeSaved, tasksCompleted, xpEarned]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="
        relative w-full max-w-2xl max-h-[90vh] overflow-hidden
        bg-surface-0 border border-white/[0.08] rounded-2xl
        shadow-2xl
        animate-in fade-in zoom-in-95 duration-300
      ">
        {/* Header */}
        <div className="
          relative px-6 py-8
          bg-gradient-to-b from-brand-500/10 to-transparent
          border-b border-white/[0.06]
        ">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
          
          {/* Week badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand-500/20">
              <Calendar className="w-3 h-3 text-brand-400" />
              <span className="text-xs font-medium text-brand-400">Week {weekNumber}</span>
            </div>
            <span className="text-xs text-text-tertiary">{dateRange}</span>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Your Week in Meaning
          </h2>
          
          {/* Summary */}
          <p className="text-text-secondary max-w-lg">
            This week, <span className="text-brand-400 font-medium">{summaryMessage}</span>
            {reputationTrait && (
              <span className="text-text-tertiary">
                {' '}You're becoming known as a{' '}
                <span className="text-purple-400">{reputationTrait}</span>.
              </span>
            )}
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-white/[0.06]">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'impact', label: 'Impact' },
            { id: 'growth', label: 'Growth' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === tab.id 
                  ? 'bg-brand-500/10 text-brand-400' 
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-1'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={CheckCircle2}
                  label="Tasks Completed"
                  value={tasksCompleted}
                  trend={tasksVsLastWeek !== 0 ? (tasksVsLastWeek > 0 ? 'up' : 'down') : undefined}
                  trendValue={tasksVsLastWeek !== 0 ? `${Math.abs(tasksVsLastWeek)}%` : undefined}
                  color="success"
                />
                <StatCard
                  icon={Zap}
                  label="XP Earned"
                  value={`+${xpEarned}`}
                  trend={xpVsLastWeek !== 0 ? (xpVsLastWeek > 0 ? 'up' : 'down') : undefined}
                  trendValue={xpVsLastWeek !== 0 ? `${Math.abs(xpVsLastWeek)}%` : undefined}
                  color="warning"
                />
                <StatCard
                  icon={Flame}
                  label="Day Streak"
                  value={`${streakDays}d`}
                  subtext={streakDays >= 7 ? '🔥 On fire!' : undefined}
                  color="orange"
                />
                <StatCard
                  icon={Clock}
                  label="Focus Time"
                  value={`${hoursWorked}h`}
                  color="cyan"
                />
              </div>
              
              {/* Biggest Ship */}
              {biggestShip && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-warning-500" />
                    <span className="text-xs font-medium text-warning-500">Biggest Ship</span>
                  </div>
                  <div className="text-lg font-semibold text-text-primary mb-1">
                    {biggestShip.title}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-tertiary">
                    {biggestShip.project && <span>{biggestShip.project}</span>}
                    {biggestShip.xp && (
                      <span className="text-success-400">+{biggestShip.xp} XP</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Achievements */}
              {achievements.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-400" />
                    Achievements Unlocked
                  </h3>
                  <div className="space-y-2">
                    {achievements.map((achievement, idx) => (
                      <AchievementRow
                        key={idx}
                        icon={achievement.icon || Star}
                        title={achievement.title}
                        description={achievement.description}
                        color={achievement.color || 'purple'}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Impact Tab */}
          {activeTab === 'impact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  icon={TrendingUp}
                  label="Progress Contributed"
                  value={`${progressContribution}%`}
                  subtext={`Toward ${projectName} launch`}
                  color="brand"
                />
                <StatCard
                  icon={Unlock}
                  label="People Unblocked"
                  value={peopleUnblocked}
                  subtext="Teammates helped"
                  color="cyan"
                />
                <StatCard
                  icon={Clock}
                  label="Time Saved"
                  value={`~${timeSaved}h`}
                  subtext="Of waiting for others"
                  color="success"
                />
              </div>
              
              {/* Goals Progress */}
              {goalsProgress.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-brand-400" />
                    Goal Progress This Week
                  </h3>
                  <div className="space-y-3">
                    {goalsProgress.map((goal, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-surface-1 border border-white/[0.06]">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-text-primary">{goal.name}</span>
                          <span className="text-xs text-text-tertiary">
                            {goal.current}% / {goal.target}%
                          </span>
                        </div>
                        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-500 rounded-full transition-all duration-500"
                            style={{ width: `${(goal.current / goal.target) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Growth Tab */}
          {activeTab === 'growth' && (
            <div className="space-y-6">
              {/* Archetype */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-brand-500/10 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs text-purple-400 mb-1">Your Archetype</div>
                    <div className="text-xl font-bold text-text-primary">{archetypeTitle}</div>
                  </div>
                </div>
              </div>
              
              {/* Top Skill Growth */}
              {topSkill && (
                <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success-400" />
                      <span className="text-sm font-medium text-text-secondary">
                        Fastest Growing Skill
                      </span>
                    </div>
                    <span className="text-xs font-medium text-success-400">
                      +{topSkill.growth}%
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-text-primary">
                    {topSkill.name}
                  </div>
                </div>
              )}
              
              {/* Reputation */}
              {reputationTrait && (
                <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-warning-500" />
                    <span className="text-sm font-medium text-text-secondary">
                      Building Reputation
                    </span>
                  </div>
                  <div className="text-text-primary">
                    You're becoming known as a{' '}
                    <span className="text-warning-500 font-medium">{reputationTrait}</span>
                  </div>
                  <div className="text-xs text-text-tertiary mt-1">
                    Based on your consistent work patterns
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Close
          </button>
          <button
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg
              bg-brand-500 text-white font-medium
              hover:bg-brand-400 transition-colors
            "
          >
            <span>Share Your Week</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MiniWeeklyReport - Compact version for dashboard
 */
export function MiniWeeklyReport({
  tasksCompleted = 0,
  xpEarned = 0,
  progressContribution = 0,
  projectName = 'your goal',
  onViewFull,
  className = '',
}) {
  return (
    <button
      onClick={onViewFull}
      className={`
        w-full p-4 rounded-xl text-left
        bg-gradient-to-r from-brand-500/10 to-purple-500/10
        border border-brand-500/20
        hover:border-brand-500/40 transition-all duration-200
        group
        ${className}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-brand-400" />
        <span className="text-xs font-medium text-brand-400">This Week's Impact</span>
      </div>
      
      <p className="text-sm text-text-secondary mb-3">
        You completed <span className="text-text-primary font-medium">{tasksCompleted} tasks</span>,
        earned <span className="text-success-400 font-medium">+{xpEarned} XP</span>,
        and moved <span className="text-brand-400 font-medium">{projectName}</span>{' '}
        <span className="text-brand-400 font-medium">{progressContribution}%</span> closer.
      </p>
      
      <div className="flex items-center gap-1 text-xs text-brand-400 group-hover:text-brand-300">
        <span>View full report</span>
        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}

export default WeeklyMeaningReport;
