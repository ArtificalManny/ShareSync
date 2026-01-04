// src/components/leaderboard/LeaderboardCard.jsx - Week 9 Day 5-6
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Flame, Users, Zap, TrendingUp } from 'lucide-react';

/**
 * LeaderboardCard - Individual user card in Hall of Fame
 * Shows rank, avatar, name, and category-specific stats
 */
const LeaderboardCard = ({ user, rank, category }) => {
  const navigate = useNavigate();

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-600 to-orange-600';
    if (rank === 2) return 'from-slate-400 to-slate-500';
    if (rank === 3) return 'from-orange-700 to-yellow-700';
    return 'from-purple-600 to-fuchsia-600';
  };

  const getStatIcon = (category) => {
    switch(category) {
      case 'streakers': return <Flame className="w-5 h-5" />;
      case 'collaborators': return <Users className="w-5 h-5" />;
      case 'shippers': return <Zap className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getStatLabel = (category) => {
    switch(category) {
      case 'streakers': return 'Day Streak';
      case 'collaborators': return 'Projects';
      case 'shippers': return 'Avg Speed';
      default: return 'Score';
    }
  };

  const getStatValue = (category) => {
    switch(category) {
      case 'streakers': return user.streak;
      case 'collaborators': return user.projectsContributed;
      case 'shippers': return `${user.avgCompletionTime}m`;
      default: return user.score;
    }
  };

  const medal = getMedalEmoji(rank);
  const rankColor = getRankColor(rank);

  return (
    <div
      onClick={() => navigate(`/profile/${user.username}`)}
      className={`bg-slate-800/50 backdrop-blur-xl border ${
        rank <= 3 ? 'border-yellow-500/30' : 'border-purple-500/20'
      } rounded-2xl p-6 shadow-xl hover:border-purple-500/50 transition-all cursor-pointer group`}
    >
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <div className="relative flex-shrink-0">
          {medal ? (
            <div className="text-5xl">{medal}</div>
          ) : (
            <div className={`w-16 h-16 bg-gradient-to-r ${rankColor} rounded-full flex items-center justify-center`}>
              <span className="text-2xl font-bold text-white">#{rank}</span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
              {user.avatar || user.name?.[0] || user.username?.[0] || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                {user.name || user.username}
              </h3>
              <p className="text-sm text-slate-400 truncate">@{user.username}</p>
            </div>
          </div>
        </div>

        {/* Stat */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-2 justify-end mb-1">
            <div className={`text-purple-400`}>
              {getStatIcon(category)}
            </div>
            <span className={`text-3xl font-bold bg-gradient-to-r ${rankColor} bg-clip-text text-transparent`}>
              {getStatValue(category)}
            </span>
          </div>
          <p className="text-xs text-slate-400">{getStatLabel(category)}</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xl font-bold text-purple-400">{user.totalXP?.toLocaleString() || 0}</div>
          <div className="text-xs text-slate-500">Total XP</div>
        </div>
        <div>
          <div className="text-xl font-bold text-fuchsia-400">{user.totalShips || 0}</div>
          <div className="text-xs text-slate-500">Ships</div>
        </div>
        <div>
          <div className="text-xl font-bold text-orange-400">{user.achievements?.length || 0}</div>
          <div className="text-xs text-slate-500">Badges</div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardCard;
