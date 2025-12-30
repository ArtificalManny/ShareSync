import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Shield } from 'lucide-react';
import api from '../../api/client';

export default function MomentumIndex() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMomentum = async () => {
      try {
        const response = await api.get('/users/momentum');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch momentum:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMomentum();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-40 bg-slate-700/50 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const { momentumIndex, status, message, breakdown } = data;

  // Color based on momentum level
  const getColor = () => {
    if (momentumIndex >= 80) return { gradient: 'from-emerald-500 to-green-400', ring: '#10b981' };
    if (momentumIndex >= 60) return { gradient: 'from-blue-500 to-cyan-400', ring: '#3b82f6' };
    if (momentumIndex >= 40) return { gradient: 'from-yellow-500 to-orange-400', ring: '#f59e0b' };
    return { gradient: 'from-red-500 to-pink-400', ring: '#ef4444' };
  };

  const colors = getColor();
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = (momentumIndex / 100) * circumference;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Momentum Index</h3>
        <TrendingUp className="w-5 h-5 text-purple-400" />
      </div>

      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" className="transform -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke={colors.ring}
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold bg-gradient-to-br ${colors.gradient} bg-clip-text text-transparent`}>
              {momentumIndex}
            </div>
            <div className="text-xs text-slate-400 mt-1">{status}</div>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-3">
          <p className="text-sm text-slate-300">{message}</p>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-slate-400">Ships today:</span>
              <span className="font-semibold text-slate-200">{breakdown.shipsToday}/{breakdown.shipsGoal}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Streak:</span>
              <span className="font-semibold text-slate-200">{breakdown.currentStreak}d</span>
            </div>
            
            <div className="flex items-center gap-2 col-span-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Focus time:</span>
              <span className="font-semibold text-slate-200">{breakdown.focusMinutes} min</span>
            </div>
          </div>

          {breakdown.streakProtected && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Streak protected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
