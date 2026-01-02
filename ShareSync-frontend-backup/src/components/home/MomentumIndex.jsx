import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Shield } from 'lucide-react';
import api from '../../api/client';
import AnimatedNumber from '../ui/AnimatedNumber'; // ⭐ NEW: Import AnimatedNumber

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
      <div className="modern-card p-6 space-y-4 animate-pulse">
        <div className="skeleton h-6 w-32" />
        <div className="flex items-center gap-6">
          <div className="skeleton h-32 w-32 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton-text w-3/4" />
            <div className="skeleton-text w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { momentumIndex, status, message, breakdown } = data;

  const getColor = () => {
    if (momentumIndex >= 80) return { 
      gradient: 'from-emerald-500 to-emerald-400', 
      ring: '#10b981',
      glow: 'shadow-emerald-500/20' 
    };
    if (momentumIndex >= 60) return { 
      gradient: 'from-primary-500 to-primary-400', 
      ring: '#6366f1',
      glow: 'shadow-primary-500/20'
    };
    if (momentumIndex >= 40) return { 
      gradient: 'from-amber-500 to-amber-400', 
      ring: '#f59e0b',
      glow: 'shadow-amber-500/20'
    };
    return { 
      gradient: 'from-red-500 to-red-400', 
      ring: '#ef4444',
      glow: 'shadow-red-500/20'
    };
  };

  const colors = getColor();
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = (momentumIndex / 100) * circumference;

  return (
    <div className={`modern-card-elevated p-6 ${colors.glow}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="heading-3">Momentum Index</h3>
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10">
          <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Modern Ring */}
        <div className="relative flex-shrink-0">
          <svg width="144" height="144" className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-200 dark:text-slate-700"
            />
            {/* Progress ring - ⭐ ANIMATED with spring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke={colors.ring}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out drop-shadow-lg"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* ⭐ ANIMATED NUMBER - smoothly counts up */}
            <AnimatedNumber 
              value={momentumIndex}
              className={`text-4xl font-bold bg-gradient-to-br ${colors.gradient} bg-clip-text text-transparent`}
            />
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              {status}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4">
          <p className="body-text text-sm">{message}</p>
          
          {/* Stats grid - ⭐ ALL NUMBERS ANIMATED */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="caption-text">Ships today</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                <AnimatedNumber value={breakdown.shipsToday} />
                /
                <AnimatedNumber value={breakdown.shipsGoal} />
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="caption-text">Streak</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                <AnimatedNumber value={breakdown.currentStreak} suffix="d" />
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="caption-text">Focus time</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                <AnimatedNumber value={breakdown.focusMinutes} suffix=" min" />
              </span>
            </div>
          </div>

          {/* Streak badge */}
          {breakdown.streakProtected && (
            <div className="badge-success inline-flex">
              <Shield className="w-3 h-3" />
              <span>Streak protected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
