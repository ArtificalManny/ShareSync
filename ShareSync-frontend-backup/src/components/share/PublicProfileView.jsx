// src/components/profile/PublicProfileView.jsx - Week 9 Day 3-4
import React, { useState } from 'react';
import { 
  Share2, Trophy, Flame, Zap, Award, 
  Star, Target, Rocket, Crown, Heart 
} from 'lucide-react';
import MomentumCard from '../share/MomentumCard';
import { useIsMobile } from '../../hooks/useMobile';

/**
 * PublicProfileView - Public profile page
 * Shows: Streak, XP, achievements (NO project details for privacy)
 */
const PublicProfileView = ({ profile }) => {
  const isMobile = useIsMobile();
  const [showMomentumCard, setShowMomentumCard] = useState(false);

  const achievements = profile.achievements || [
    { id: 1, icon: '🔥', title: '100-Day Streak', description: 'Shipped for 100 days straight', earnedAt: '2024-01-15' },
    { id: 2, icon: '⚡', title: '10K XP', description: 'Earned 10,000 XP total', earnedAt: '2024-01-10' },
    { id: 3, icon: '🏆', title: 'Early Adopter', description: 'Joined ShareSync beta', earnedAt: '2023-12-01' },
    { id: 4, icon: '🚀', title: 'Consistent Shipper', description: 'Shipped 50 tasks', earnedAt: '2024-01-05' },
    { id: 5, icon: '👑', title: 'Team Leader', description: 'Led 3 successful projects', earnedAt: '2023-12-20' }
  ];

  const stats = [
    {
      icon: <Flame className="w-6 h-6" />,
      label: 'Current Streak',
      value: profile.streak || 127,
      unit: 'days',
      color: 'from-orange-600 to-red-600',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      label: 'Total XP',
      value: (profile.totalXP || 15840).toLocaleString(),
      unit: 'XP',
      color: 'from-purple-600 to-fuchsia-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      label: 'Achievements',
      value: achievements.length,
      unit: 'earned',
      color: 'from-yellow-600 to-orange-600',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30'
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      label: 'Total Ships',
      value: profile.totalShips || 342,
      unit: 'ships',
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="text-white pb-20">
      <div className={`max-w-5xl mx-auto ${isMobile ? 'px-4' : 'px-6'} py-12`}>
        
        {/* Profile Header */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center text-6xl font-bold">
              {profile.avatar || profile.name?.[0] || profile.username?.[0] || '?'}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
                {profile.name || profile.username}
              </h1>
              <p className="text-xl text-slate-400 mb-4">@{profile.username}</p>
              {profile.bio && (
                <p className="text-slate-300 max-w-2xl">{profile.bio}</p>
              )}
            </div>

            {/* Share Button */}
            <button
              onClick={() => setShowMomentumCard(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg"
            >
              <Share2 className="w-5 h-5" />
              Share My Momentum
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`${stat.bgColor} border ${stat.borderColor} backdrop-blur-xl rounded-2xl p-6 shadow-xl`}
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                {stat.icon}
              </div>
              <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Achievements Section */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Achievements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-purple-500/30 transition-all"
              >
                <div className="text-5xl mb-3">{achievement.icon}</div>
                <h3 className="font-bold text-white mb-2">{achievement.title}</h3>
                <p className="text-sm text-slate-400 mb-3">{achievement.description}</p>
                <p className="text-xs text-slate-500">
                  Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            🔒 Project details are private and not shown on public profiles
          </p>
        </div>

        {/* Momentum Card Modal */}
        {showMomentumCard && (
          <MomentumCard
            user={{
              ...profile,
              achievements: achievements
            }}
            onClose={() => setShowMomentumCard(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PublicProfileView;