// src/components/project/AICoachPanel.jsx
import React, { useState, useEffect } from 'react';
import { Brain, Zap, Users, TrendingDown, TrendingUp, Lightbulb, Clock, Target } from 'lucide-react';

function AICoachPanel({ 
  project, 
  stats, 
  presence,
  onStartFocus,
  onInviteTeam,
  className = ''
}) {
  const [currentNudge, setCurrentNudge] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    // Generate real-time insights based on project state
    const generateInsights = () => {
      const newInsights = [];
      const now = new Date();
      const hour = now.getHours();
      
      // Productive window detection
      if (hour >= 9 && hour <= 11) {
        newInsights.push({
          type: 'timing',
          icon: Clock,
          message: "You're usually strongest now. Want to tackle your top task?",
          action: { label: 'Start 25-min sprint', onClick: onStartFocus },
          tone: 'positive'
        });
      }

      // XP competition
      const userXP = stats?.xp?.value || 0;
      const leaderXP = 2450; // This would come from actual leaderboard
      const xpGap = leaderXP - userXP;
      if (xpGap > 0 && xpGap < 500) {
        newInsights.push({
          type: 'competition',
          icon: TrendingUp,
          message: `You're ${xpGap} XP behind Alex. Ship something to catch up!`,
          action: { label: 'View leaderboard', onClick: () => window.location.href = '/discover' },
          tone: 'challenge'
        });
      }

      // Team activity
      const onlineCount = presence?.onlineIds?.length || 0;
      if (onlineCount > 0) {
        newInsights.push({
          type: 'social',
          icon: Users,
          message: `${onlineCount} teammate${onlineCount > 1 ? 's are' : ' is'} live right now. Join them!`,
          action: { label: 'Start group focus', onClick: onStartFocus },
          tone: 'social'
        });
      }

      // Velocity detection
      const velocity = stats?.throughputPerWeek?.value || 0;
      const previousVelocity = stats?.previousThroughputPerWeek?.value || velocity;
      if (velocity < previousVelocity * 0.8) {
        newInsights.push({
          type: 'warning',
          icon: TrendingDown,
          message: `Throughput dropped ${Math.round((1 - velocity/previousVelocity) * 100)}% this week. Need help?`,
          action: { label: 'Review blockers', onClick: () => {} },
          tone: 'warning'
        });
      }

      // Streak protection
      const streak = stats?.streak?.value || 0;
      const lastActivity = project?.updatedAt ? new Date(project.updatedAt) : null;
      const hoursSinceActivity = lastActivity ? (now - lastActivity) / (1000 * 60 * 60) : 0;
      if (streak > 5 && hoursSinceActivity > 20) {
        newInsights.push({
          type: 'urgent',
          icon: Zap,
          message: `Your ${streak}-day streak expires in ${24 - Math.floor(hoursSinceActivity)} hours!`,
          action: { label: 'Save my streak', onClick: onStartFocus },
          tone: 'urgent'
        });
      }

      // Smart suggestions
      const openTasks = (project?.tasks || []).filter(t => !t.completed).length;
      if (openTasks > 20) {
        newInsights.push({
          type: 'suggestion',
          icon: Lightbulb,
          message: `${openTasks} open tasks. Consider breaking them into smaller sprints.`,
          action: { label: 'Organize tasks', onClick: () => {} },
          tone: 'neutral'
        });
      }

      setInsights(newInsights);
      if (newInsights.length > 0) {
        setCurrentNudge(newInsights[0]);
      }
    };

    generateInsights();
    const interval = setInterval(generateInsights, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [project, stats, presence, onStartFocus]);

  const getToneStyle = (tone) => {
    switch(tone) {
      case 'positive':
        return 'bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border-purple-500/30';
      case 'challenge':
        return 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30';
      case 'social':
        return 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30';
      case 'urgent':
        return 'bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/30 animate-pulse';
      default:
        return 'bg-slate-800/50 border-slate-700/50';
    }
  };

  if (!currentNudge && insights.length === 0) {
    return (
      <div className={`rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">AI Coach</h3>
        </div>
        <p className="text-sm text-slate-400">
          Your AI assistant is watching project health, team activity, and momentum patterns.
          You'll get smart nudges when needed.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border backdrop-blur-sm p-6 ${getToneStyle(currentNudge?.tone)} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {currentNudge?.icon && <currentNudge.icon className="w-6 h-6 text-purple-400" />}
          <div>
            <h3 className="text-sm font-semibold text-white">AI Coach</h3>
            <p className="text-xs text-slate-400">Real-time insights</p>
          </div>
        </div>
        {insights.length > 1 && (
          <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">
            {insights.length} insights
          </span>
        )}
      </div>

      {/* Current Nudge */}
      {currentNudge && (
        <div className="space-y-3">
          <p className="text-sm text-white leading-relaxed">
            {currentNudge.message}
          </p>
          
          {currentNudge.action && (
            <button
              onClick={currentNudge.action.onClick}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-4 py-2 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
            >
              <Zap className="w-4 h-4" />
              {currentNudge.action.label}
            </button>
          )}
        </div>
      )}

      {/* Additional Insights */}
      {insights.length > 1 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs text-slate-400 mb-2">Other insights:</div>
          <div className="space-y-2">
            {insights.slice(1, 3).map((insight, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors"
                onClick={() => setCurrentNudge(insight)}
              >
                {insight.icon && <insight.icon className="w-3 h-3" />}
                <span className="line-clamp-1">{insight.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{stats?.throughputPerWeek?.value || 0}</div>
          <div className="text-[10px] text-slate-400 uppercase">Tasks/wk</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">{stats?.streak?.value || 0}</div>
          <div className="text-[10px] text-slate-400 uppercase">Day streak</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">{project?.members?.length || 0}</div>
          <div className="text-[10px] text-slate-400 uppercase">Team</div>
        </div>
      </div>
    </div>
  );
}

export default AICoachPanel;