import React, { useState } from 'react';
import { Trophy, Star, Zap, Shield, Flame, Target, Crown, Sparkles } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const Achievements = () => {
  const isMobile = useIsMobile();

  // Mock data - will be replaced with real API
  const [achievements, setAchievements] = useState({
    recent: [
      {
        id: 1,
        name: '7-Day Streak',
        description: 'Ship something 7 days in a row',
        icon: Flame,
        color: 'orange',
        xp: 100,
        date: 'Today',
        rarity: 'common'
      },
      {
        id: 2,
        name: 'Quick Shipper',
        description: 'Complete 5 tasks in under 25 minutes',
        icon: Zap,
        color: 'yellow',
        xp: 50,
        date: 'Yesterday',
        rarity: 'common'
      }
    ],
    milestones: [
      {
        id: 1,
        name: 'Level 5',
        current: 1850,
        target: 2000,
        icon: Star,
        color: 'purple'
      },
      {
        id: 2,
        name: '30-Day Streak',
        current: 7,
        target: 30,
        icon: Flame,
        color: 'orange'
      },
      {
        id: 3,
        name: '100 Ships',
        current: 42,
        target: 100,
        icon: Trophy,
        color: 'yellow'
      }
    ],
    badges: [
      { icon: Flame, color: 'text-orange-400', label: '7d', unlocked: true },
      { icon: Zap, color: 'text-yellow-400', label: 'Fast', unlocked: true },
      { icon: Shield, color: 'text-blue-400', label: 'Protected', unlocked: true },
      { icon: Trophy, color: 'text-slate-600', label: '100d', unlocked: false },
      { icon: Crown, color: 'text-slate-600', label: 'Elite', unlocked: false },
      { icon: Star, color: 'text-slate-600', label: 'Master', unlocked: false },
    ]
  });

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'legendary': return 'from-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  if (isMobile) {
    // Mobile compact view
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h3 className="font-bold text-white">Achievements</h3>
        </div>

        {/* Recent achievement */}
        {achievements.recent.length > 0 && (
          <div className={`bg-gradient-to-r ${getRarityColor(achievements.recent[0].rarity)} p-0.5 rounded-xl mb-3`}>
            <div className="bg-slate-900 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-${achievements.recent[0].color}-500/20 rounded-xl flex items-center justify-center`}>
                  <achievements.recent[0].icon className={`w-6 h-6 text-${achievements.recent[0].color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{achievements.recent[0].name}</p>
                  <p className="text-xs text-slate-400">+{achievements.recent[0].xp} XP</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="flex gap-2 justify-center">
          {achievements.badges.slice(0, 6).map((badge, idx) => (
            <div
              key={idx}
              className={`w-10 h-10 rounded-lg ${
                badge.unlocked ? 'bg-slate-700' : 'bg-slate-800/50'
              } flex items-center justify-center`}
            >
              <badge.icon className={`w-5 h-5 ${badge.color}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop full view
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white">Your Achievements</h3>
          <p className="text-xs text-slate-400">Recent wins & milestones</p>
        </div>
      </div>

      {/* Recent achievements */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Recently Earned
        </h4>
        {achievements.recent.map(achievement => (
          <div
            key={achievement.id}
            className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} p-0.5 rounded-xl`}
          >
            <div className="bg-slate-900 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 bg-${achievement.color}-500/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <achievement.icon className={`w-6 h-6 text-${achievement.color}-400`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-semibold text-white">{achievement.name}</h5>
                    <span className="text-xs text-slate-400">{achievement.date}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{achievement.description}</p>
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full">
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300">+{achievement.xp} XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Milestones in progress */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-400" />
          Next Milestones
        </h4>
        {achievements.milestones.map(milestone => {
          const Icon = milestone.icon;
          const progress = (milestone.current / milestone.target) * 100;
          
          return (
            <div key={milestone.id} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 text-${milestone.color}-400`} />
                <span className="font-semibold text-white">{milestone.name}</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{milestone.current} / {milestone.target}</span>
                  <span className="font-semibold text-white">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-${milestone.color}-600 to-${milestone.color}-400 transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge collection */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Badge Collection</h4>
        <div className="grid grid-cols-6 gap-3">
          {achievements.badges.map((badge, idx) => (
            <div
              key={idx}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center gap-1 
                transition-all cursor-pointer
                ${badge.unlocked 
                  ? 'bg-slate-700 hover:bg-slate-600 hover:scale-110' 
                  : 'bg-slate-800/30 opacity-50'
                }
              `}
              title={badge.unlocked ? `${badge.label} Badge` : 'Locked'}
            >
              <badge.icon className={`w-6 h-6 ${badge.color}`} />
              {badge.unlocked && (
                <span className="text-xs text-slate-400">{badge.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
