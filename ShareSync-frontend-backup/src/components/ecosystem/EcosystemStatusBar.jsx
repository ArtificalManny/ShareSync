import React, { useState, useEffect } from 'react';
import { 
  Rocket, TrendingUp, Flame, AlertTriangle, DollarSign, 
  Users, ChevronRight, Activity 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useMobile';
import useSocket from '../../hooks/useSocket';
import ecosystemApi from '../../services/ecosystemApi';

const EcosystemStatusBar = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // ⭐ State with initial mock data
  const [stats, setStats] = useState({
    activeProjects: 3,
    shipsToday: 5,
    usersOnStreaks: 2,
    projectsAtRisk: 1,
    revenueThisMonth: 2450,
    teamMomentum: 'high',
    loading: true,
  });

  // ⭐ Fetch real data from API
  useEffect(() => {
    fetchEcosystemStatus();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchEcosystemStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchEcosystemStatus = async () => {
    try {
      const data = await ecosystemApi.getStatus();
      if (data) {
        setStats({
          activeProjects: data.activeProjects,
          shipsToday: data.shipsToday,
          usersOnStreaks: data.onStreaks,
          projectsAtRisk: data.atRisk,
          revenueThisMonth: data.revenue,
          teamMomentum: data.momentum,
          loading: false
        });
      } else {
        setStats(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to fetch ecosystem status:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  // ⭐ Listen for real-time ecosystem updates
  useSocket(null, {
    onEvents: {
      'ecosystem:update': (data) => {
        console.log('Ecosystem update received:', data);
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            ...data.stats,
            activeProjects: data.stats.activeProjects ?? prev.activeProjects,
            shipsToday: data.stats.shipsToday ?? prev.shipsToday,
            usersOnStreaks: data.stats.onStreaks ?? prev.usersOnStreaks,
            projectsAtRisk: data.stats.atRisk ?? prev.projectsAtRisk,
            revenueThisMonth: data.stats.revenue ?? prev.revenueThisMonth,
            teamMomentum: data.stats.momentum ?? prev.teamMomentum
          }));
        }
      },
      'team:ship': () => {
        // Increment ships count
        setStats(prev => ({ ...prev, shipsToday: prev.shipsToday + 1 }));
      }
    }
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
            {!stats.loading && (
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse ml-auto" title="Live" />
            )}
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
        <div className="flex items-center gap-3">
          {!stats.loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-700">
            {getMomentumIcon(stats.teamMomentum)}
            <span className={`font-semibold ${getMomentumColor(stats.teamMomentum)}`}>
              {stats.teamMomentum.toUpperCase()} MOMENTUM
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        {/* Active Projects */}
        <button 
          className="group bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 hover:border-purple-500/50 rounded-xl p-4 transition-all text-left"
          onClick={() => navigate('/projects')}
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
          onClick={() => stats.projectsAtRisk > 0 && navigate('/projects')}
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
          <span>Team connected</span>
        </div>
      </div>
    </div>
  );
};

export default EcosystemStatusBar;
