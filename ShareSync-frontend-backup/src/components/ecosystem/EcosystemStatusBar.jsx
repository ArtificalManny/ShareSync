import React, { useState, useEffect } from 'react';
import { 
  Rocket, TrendingUp, Flame, AlertTriangle, DollarSign, 
  Users, ChevronRight, Activity 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useMobile';
import useSocket from '../../hooks/useSocket';
import ecosystemApi from '../../services/ecosystemApi';
import Card, { CardHeader, CardBody } from '../common/Card';

const EcosystemStatusBar = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [stats, setStats] = useState({
    activeProjects: 3,
    shipsToday: 5,
    usersOnStreaks: 2,
    projectsAtRisk: 1,
    revenueThisMonth: 2450,
    teamMomentum: 'high',
    loading: true,
  });

  useEffect(() => {
    fetchEcosystemStatus();
    const interval = setInterval(fetchEcosystemStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchEcosystemStatus = async () => {
    try {
      const data = await ecosystemApi.getStatus();
      if (data) {
        setStats({ activeProjects: data.activeProjects, shipsToday: data.shipsToday, usersOnStreaks: data.onStreaks, projectsAtRisk: data.atRisk, revenueThisMonth: data.revenue, teamMomentum: data.momentum, loading: false });
      } else {
        setStats(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error(error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useSocket(null, {
    onEvents: {
      'ecosystem:update': (data) => { if (data.stats) setStats(prev => ({ ...prev, ...data.stats })); },
      'team:ship': () => { setStats(prev => ({ ...prev, shipsToday: prev.shipsToday + 1 })); }
    }
  });

  const getMomentumColor = (momentum) => {
    switch(momentum) {
      case 'high': return 'text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10';
      case 'medium': return 'text-amber-500 dark:text-yellow-400 bg-amber-100 dark:bg-yellow-400/10';
      case 'low': return 'text-orange-500 dark:text-orange-400 bg-orange-100 dark:bg-orange-400/10';
      default: return 'text-slate-500 bg-slate-100';
    }
  };

  if (isMobile) {
    return (
      <Card className="bg-white dark:bg-gradient-to-br dark:from-violet-900/20 dark:to-transparent border-slate-200 dark:border-violet-500/20 shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">Ecosystem</h2>
            {!stats.loading && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-auto shadow-sm shadow-emerald-500/50" />}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
              <div className="text-xl font-bold text-slate-800 dark:text-white mb-1">{stats.activeProjects}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Projects</div>
            </div>
            <div className="bg-emerald-50 dark:bg-white/5 rounded-xl p-3 border border-emerald-100 dark:border-white/5">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{stats.shipsToday}</div>
              <div className="text-[10px] text-emerald-600/70 dark:text-slate-500 uppercase font-bold tracking-wider">Ships</div>
            </div>
            <div className="bg-orange-50 dark:bg-white/5 rounded-xl p-3 border border-orange-100 dark:border-white/5">
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-1">{stats.usersOnStreaks}</div>
              <div className="text-[10px] text-orange-600/70 dark:text-slate-500 uppercase font-bold tracking-wider">Streaks</div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-surface-1 border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
      <CardHeader className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-100 dark:bg-brand/10 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-violet-600 dark:text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Ecosystem Status</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary">Live operational intelligence</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/50 dark:border-transparent ${getMomentumColor(stats.teamMomentum)}`}>
          <TrendingUp className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-widest">
            {stats.teamMomentum} Momentum
          </span>
        </div>
      </CardHeader>

      <CardBody className="grid grid-cols-5 gap-4 p-6 bg-white dark:bg-transparent">
        {[
          { label: 'Active Projects', val: stats.activeProjects, icon: Rocket, color: 'text-violet-600 dark:text-brand', bg: 'bg-violet-50 dark:bg-brand/5', border: 'border-violet-100 dark:border-white/5', hover: 'hover:border-violet-300 dark:hover:border-brand/30', path: '/projects' },
          { label: 'Ships Today', val: stats.shipsToday, icon: CheckCircle, color: 'text-emerald-600 dark:text-success', bg: 'bg-emerald-50 dark:bg-success/5', border: 'border-emerald-100 dark:border-white/5', hover: 'hover:border-emerald-300 dark:hover:border-success/30', path: null },
          { label: 'On Streaks', val: stats.usersOnStreaks, icon: Flame, color: 'text-orange-500 dark:text-warning', bg: 'bg-orange-50 dark:bg-warning/5', border: 'border-orange-100 dark:border-white/5', hover: 'hover:border-orange-300 dark:hover:border-warning/30', path: null },
          { label: 'At Risk', val: stats.projectsAtRisk, icon: AlertTriangle, color: 'text-red-500 dark:text-danger', bg: 'bg-red-50 dark:bg-danger/5', border: 'border-red-100 dark:border-white/5', hover: 'hover:border-red-300 dark:hover:border-danger/30', path: '/projects' },
          { label: 'Monthly Rev', val: `$${stats.revenueThisMonth.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 dark:text-success', bg: 'bg-emerald-50 dark:bg-success/5', border: 'border-emerald-100 dark:border-white/5', hover: 'hover:border-emerald-300 dark:hover:border-success/30', path: null }
        ].map((item, i) => (
          <button 
            key={i}
            onClick={() => item.path && navigate(item.path)}
            className={`group ${item.bg} border ${item.border} ${item.hover} rounded-2xl p-5 transition-all duration-200 text-left flex flex-col justify-between h-32 hover:-translate-y-1 hover:shadow-md cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <item.icon className={`w-6 h-6 ${item.color}`} />
              {item.path && <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />}
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white leading-none mb-1.5">{item.val}</div>
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{item.label}</div>
            </div>
          </button>
        ))}
      </CardBody>
      
      <div className="px-6 py-3 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50" />
              <span>Network Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              <span>{stats.shipsToday + 2} nodes live</span>
            </div>
         </div>
      </div>
    </Card>
  );
};

export default EcosystemStatusBar;
