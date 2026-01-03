import React, { useState, useEffect } from 'react';
import { 
  Rocket, TrendingUp, Flame, AlertTriangle, DollarSign, 
  Users, ChevronRight, Activity 
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const EcosystemStatusBar = () => {
  const isMobile = useIsMobile();
  
  // Mock data - will be replaced with real API calls
  const [stats, setStats] = useState({
    activeProjects: 3,
    shipsToday: 5,
    usersOnStreaks: 2,
    projectsAtRisk: 1,
    revenueThisMonth: 2450,
    teamMomentum: 'high', // low, medium, high
    loading: false,
  });

  const getMomentumColor = (momentum) => {
    switch(momentum) {
      case 'high': return 'text-emerald-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const getMomentumIcon = (momentum) => {
    switch(momentum) {
      case 'high': return <TrendingUp className="w-4 h-4" />;
      case 'medium': return <Activity className="w-4 h-4" />;
      case 'low': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (isMobile) {
    // Mobile compact version
    return (
      <div className="bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 border-b border-purple-500/30 backdrop-blur-xl">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Your World</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-900/50 rounded-lg p-2">
              <div className="text-purple-400 font-bold">{stats.activeProjects}</div>
              <div className="text-slate-400">Projects</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2">
              <div className="text-emerald-400 font-bold">{stats.shipsToday}</div>
              <div className="text-slate-400">Ships</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2">
              <div className="text-orange-400 font-bold">{stats.usersOnStreaks}</div>
              <div className="text-slate-400">Streaks</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop full version
  return (
    <div className="bg-gradient-to-r from-purple-600/10 to-fuchsia-600/10 border border-purple-500/20 rounded-2xl p-6 mb-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Your World</h2>
            <p className="text-sm text-slate-400">Mission control for all your work</p>
          </div>
        </div>

        {/* Momentum indicator */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-700">
          {getMomentumIcon(stats.teamMomentum)}
          <span className={`font-semibold ${getMomentumColor(stats.teamMomentum)}`}>
            {stats.teamMomentum.toUpperCase()} MOMENTUM
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        {/* Active Projects */}
        <button 
          className="group bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 hover:border-purple-500/50 rounded-xl p-4 transition-all text-left"
          onClick={() => console.log('Navigate to projects')}
        >
          <div className="flex items-center justify-between mb-2">
            <Rocket className="w-5 h-5 text-purple-400" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.activeProjects}</div>
          <div className="text-xs text-slate-400">Active Projects</div>
        </button>

        {/* Ships Today */}
        <button 
          className="group bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 transition-all text-left"
          onClick={() => console.log('Navigate to activity')}
        >
          <div className="flex items-center justify-between mb-2">
            <Rocket className="w-5 h-5 text-emerald-400" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.shipsToday}</div>
          <div className="text-xs text-slate-400">Ships Today</div>
        </button>

        {/* Users on Streaks */}
        <button 
          className="group bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 hover:border-orange-500/50 rounded-xl p-4 transition-all text-left"
          onClick={() => console.log('Navigate to streaks')}
        >
          <div className="flex items-center justify-between mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.usersOnStreaks}</div>
          <div className="text-xs text-slate-400">On Streaks</div>
        </button>

        {/* Projects at Risk */}
        <button 
          className="group bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 hover:border-red-500/50 rounded-xl p-4 transition-all text-left"
          onClick={() => console.log('Navigate to at-risk projects')}
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.projectsAtRisk}</div>
          <div className="text-xs text-slate-400">At Risk</div>
        </button>

        {/* Revenue This Month */}
        <button 
          className="group bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 transition-all text-left"
          onClick={() => console.log('Navigate to payments')}
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            ${stats.revenueThisMonth.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">This Month</div>
        </button>
      </div>

      {/* Quick insights */}
      <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span>All systems operational</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>5 teammates online</span>
        </div>
      </div>
    </div>
  );
};

export default EcosystemStatusBar;
