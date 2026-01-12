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
import Button from '../common/Button';

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

  useSocket(null, {
    onEvents: {
      'ecosystem:update': (data) => {
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            ...data.stats
          }));
        }
      },
      'team:ship': () => {
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

  if (isMobile) {
    return (
      <Card className="bg-gradient-to-br from-purple-600/10 to-transparent border-purple-500/20">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Ecosystem</h2>
            {!stats.loading && (
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse ml-auto" />
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <div className="text-lg font-bold text-white">{stats.activeProjects}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Projects</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <div className="text-lg font-bold text-emerald-400">{stats.shipsToday}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Ships</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <div className="text-lg font-bold text-orange-400">{stats.usersOnStreaks}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Streaks</div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
      <CardHeader className="flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ecosystem Status</h2>
            <p className="text-xs text-slate-500">Live operational intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 rounded-full border border-white/10">
          <TrendingUp className={`w-3.5 h-3.5 ${getMomentumColor(stats.teamMomentum)}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${getMomentumColor(stats.teamMomentum)}`}>
            {stats.teamMomentum} Momentum
          </span>
        </div>
      </CardHeader>

      <CardBody className="grid grid-cols-5 gap-3">
        {[
          { label: 'Active Projects', val: stats.activeProjects, icon: Rocket, color: 'text-purple-400', border: 'hover:border-purple-500/30', path: '/projects' },
          { label: 'Ships Today', val: stats.shipsToday, icon: Rocket, color: 'text-emerald-400', border: 'hover:border-emerald-500/30', path: null },
          { label: 'On Streaks', val: stats.usersOnStreaks, icon: Flame, color: 'text-orange-400', border: 'hover:border-orange-500/30', path: null },
          { label: 'At Risk', val: stats.projectsAtRisk, icon: AlertTriangle, color: 'text-red-400', border: 'hover:border-red-500/30', path: '/projects' },
          { label: 'Monthly Rev', val: `$${stats.revenueThisMonth.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', border: 'hover:border-emerald-500/30', path: null }
        ].map((item, i) => (
          <button 
            key={i}
            onClick={() => item.path && navigate(item.path)}
            className={`group bg-white/[0.03] border border-white/5 ${item.border} rounded-xl p-4 transition-all text-left flex flex-col justify-between h-28`}
          >
            <div className="flex items-center justify-between">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              {item.path && <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-all" />}
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-none mb-1">{item.val}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{item.label}</div>
            </div>
          </button>
        ))}
      </CardBody>
      
      <div className="px-4 py-2 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Network Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              <span>{stats.shipsToday + 2} nodes live</span>
            </div>
         </div>
      </div>
    </Card>
  );
};

export default EcosystemStatusBar;
