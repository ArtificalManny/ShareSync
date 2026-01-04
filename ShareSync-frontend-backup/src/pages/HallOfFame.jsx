// src/pages/HallOfFame.jsx - Week 9 Day 5-6
import React, { useState, useEffect } from 'react';
import { Crown, Flame, Users, Zap, Trophy, TrendingUp } from 'lucide-react';
import { useIsMobile } from '../hooks/useMobile';
import LeaderboardCard from '../components/leaderboard/LeaderboardCard';

/**
 * HallOfFame - Showcase top performers
 * Categories: Top Streakers, Most Collaborative, Fastest Shippers
 */
const HallOfFame = () => {
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState('streakers');
  const [loading, setLoading] = useState(true);

  // Mock data - replace with real API calls
  const leaderboards = {
    streakers: [
      { id: 1, username: 'sarah_ships', name: 'Sarah Chen', avatar: '👩', streak: 342, totalXP: 45200, totalShips: 892, achievements: [{},{},{},{},{}] },
      { id: 2, username: 'mike_codes', name: 'Mike Rodriguez', avatar: '👨', streak: 287, totalXP: 38900, totalShips: 743, achievements: [{},{},{},{}] },
      { id: 3, username: 'alex_builds', name: 'Alex Kim', avatar: '🧑', streak: 215, totalXP: 32100, totalShips: 654, achievements: [{},{},{}] },
      { id: 4, username: 'emma_creates', name: 'Emma Wilson', avatar: '👩', streak: 198, totalXP: 28400, totalShips: 587, achievements: [{},{},{}] },
      { id: 5, username: 'jordan_dev', name: 'Jordan Lee', avatar: '👨', streak: 176, totalXP: 25600, totalShips: 521, achievements: [{},{}] },
      { id: 6, username: 'taylor_pm', name: 'Taylor Swift', avatar: '👩', streak: 163, totalXP: 23100, totalShips: 478, achievements: [{},{}] },
      { id: 7, username: 'casey_designs', name: 'Casey Morgan', avatar: '🧑', streak: 145, totalXP: 21200, totalShips: 432, achievements: [{},{}] },
      { id: 8, username: 'riley_tech', name: 'Riley Johnson', avatar: '👨', streak: 132, totalXP: 19800, totalShips: 398, achievements: [{}] },
      { id: 9, username: 'quinn_ai', name: 'Quinn Davis', avatar: '👩', streak: 127, totalXP: 18500, totalShips: 367, achievements: [{}] },
      { id: 10, username: 'manny', name: 'Manny Rivas', avatar: '🚀', streak: 119, totalXP: 17200, totalShips: 342, achievements: [{}] }
    ],
    collaborators: [
      { id: 1, username: 'team_player', name: 'Alex Kim', avatar: '🧑', projectsContributed: 47, totalXP: 42300, totalShips: 723, achievements: [{},{},{},{},{}] },
      { id: 2, username: 'helper_hero', name: 'Emma Wilson', avatar: '👩', projectsContributed: 38, totalXP: 36700, totalShips: 654, achievements: [{},{},{},{}] },
      { id: 3, username: 'collab_king', name: 'Jordan Lee', avatar: '👨', projectsContributed: 32, totalXP: 31200, totalShips: 587, achievements: [{},{},{}] },
      { id: 4, username: 'team_mate', name: 'Sarah Chen', avatar: '👩', projectsContributed: 28, totalXP: 28900, totalShips: 521, achievements: [{},{},{}] },
      { id: 5, username: 'project_pro', name: 'Mike Rodriguez', avatar: '👨', projectsContributed: 24, totalXP: 25400, totalShips: 478, achievements: [{},{}] },
      { id: 6, username: 'group_guru', name: 'Taylor Swift', avatar: '👩', projectsContributed: 21, totalXP: 22800, totalShips: 432, achievements: [{},{}] },
      { id: 7, username: 'squad_star', name: 'Casey Morgan', avatar: '🧑', projectsContributed: 19, totalXP: 20100, totalShips: 398, achievements: [{},{}] },
      { id: 8, username: 'crew_chief', name: 'Riley Johnson', avatar: '👨', projectsContributed: 17, totalXP: 18700, totalShips: 367, achievements: [{}] },
      { id: 9, username: 'ally_ace', name: 'Quinn Davis', avatar: '👩', projectsContributed: 15, totalXP: 17200, totalShips: 342, achievements: [{}] },
      { id: 10, username: 'manny', name: 'Manny Rivas', avatar: '🚀', projectsContributed: 13, totalXP: 15800, totalShips: 321, achievements: [{}] }
    ],
    shippers: [
      { id: 1, username: 'speed_demon', name: 'Mike Rodriguez', avatar: '👨', avgCompletionTime: 8, totalXP: 48900, totalShips: 1024, achievements: [{},{},{},{},{},{}] },
      { id: 2, username: 'quick_ship', name: 'Sarah Chen', avatar: '👩', avgCompletionTime: 12, totalXP: 43200, totalShips: 892, achievements: [{},{},{},{},{}] },
      { id: 3, username: 'fast_track', name: 'Jordan Lee', avatar: '👨', avgCompletionTime: 15, totalXP: 38700, totalShips: 765, achievements: [{},{},{},{}] },
      { id: 4, username: 'rapid_fire', name: 'Alex Kim', avatar: '🧑', avgCompletionTime: 18, totalXP: 34100, totalShips: 687, achievements: [{},{},{}] },
      { id: 5, username: 'swift_coder', name: 'Emma Wilson', avatar: '👩', avgCompletionTime: 22, totalXP: 30500, totalShips: 612, achievements: [{},{},{}] },
      { id: 6, username: 'velocity_v', name: 'Taylor Swift', avatar: '👩', avgCompletionTime: 25, totalXP: 27800, totalShips: 548, achievements: [{},{}] },
      { id: 7, username: 'turbo_task', name: 'Casey Morgan', avatar: '🧑', avgCompletionTime: 28, totalXP: 24900, totalShips: 487, achievements: [{},{}] },
      { id: 8, username: 'zoom_zone', name: 'Riley Johnson', avatar: '👨', avgCompletionTime: 32, totalXP: 22300, totalShips: 432, achievements: [{},{}] },
      { id: 9, username: 'blitz_build', name: 'Quinn Davis', avatar: '👩', avgCompletionTime: 35, totalXP: 20100, totalShips: 389, achievements: [{}] },
      { id: 10, username: 'manny', name: 'Manny Rivas', avatar: '🚀', avgCompletionTime: 38, totalXP: 18700, totalShips: 342, achievements: [{}] }
    ]
  };

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [activeCategory]);

  const categories = [
    {
      id: 'streakers',
      label: 'Top Streakers',
      icon: <Flame className="w-5 h-5" />,
      description: 'Longest current streaks',
      color: 'from-orange-600 to-red-600'
    },
    {
      id: 'collaborators',
      label: 'Most Collaborative',
      icon: <Users className="w-5 h-5" />,
      description: 'Most team projects contributed to',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'shippers',
      label: 'Fastest Shippers',
      icon: <Zap className="w-5 h-5" />,
      description: 'Quickest average completion time',
      color: 'from-purple-600 to-fuchsia-600'
    }
  ];

  const activeLeaderboard = leaderboards[activeCategory];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="text-white pb-20">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-6'} py-12`}>
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full flex items-center justify-center mx-auto">
              <Crown className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-3">
            Hall of Fame
          </h1>
          <p className="text-slate-400 text-lg">Celebrating our most productive members</p>
        </div>

        {/* Category Tabs */}
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 mb-12`}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`p-6 rounded-2xl border-2 transition-all ${
                activeCategory === category.id
                  ? `bg-gradient-to-r ${category.color} border-transparent shadow-2xl scale-105`
                  : 'bg-slate-800/30 border-slate-700 hover:border-purple-500/50'
              }`}
            >
              <div className={`w-12 h-12 ${
                activeCategory === category.id 
                  ? 'bg-white/20' 
                  : 'bg-slate-700'
              } rounded-xl flex items-center justify-center mx-auto mb-3`}>
                {category.icon}
              </div>
              <h3 className="font-bold text-lg mb-1">{category.label}</h3>
              <p className={`text-sm ${
                activeCategory === category.id 
                  ? 'text-white/80' 
                  : 'text-slate-400'
              }`}>
                {category.description}
              </p>
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeLeaderboard.map((user, index) => (
              <LeaderboardCard
                key={user.id}
                user={user}
                rank={index + 1}
                category={activeCategory}
              />
            ))}
          </div>
        )}

        {/* Footer Message */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl px-8 py-6">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <p className="text-slate-300 max-w-2xl">
              Keep shipping to climb the ranks! All leaderboards update in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallOfFame;
