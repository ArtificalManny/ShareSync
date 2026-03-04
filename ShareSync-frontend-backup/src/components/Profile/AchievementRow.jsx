// src/components/profile/AchievementRow.jsx
import React from 'react';
import { Award, Target, Rocket, Zap, Shield, Crown, Flame } from 'lucide-react';

export default function AchievementRow({ user }) {
  const xp = user?.xp || 0;
  const streak = user?.currentStreak || 0;
  const ships = user?.totalShips || user?.completedTasks || 0;

  // Generate dynamic badges based on actual stats to feel like a game
  const badges = [
    { id: 'first_blood', icon: Target, name: 'First Move', desc: 'Shipped your first move', earned: ships >= 1, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' },
    { id: 'streak_3', icon: Flame, name: 'Heating Up', desc: '3 Day Streak', earned: streak >= 3, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' },
    { id: 'streak_7', icon: Flame, name: 'On Fire', desc: '7 Day Streak', earned: streak >= 7, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' },
    { id: 'xp_1000', icon: Zap, name: '1K Club', desc: 'Earned 1,000 XP', earned: xp >= 1000, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20' },
    { id: 'ships_10', icon: Rocket, name: 'Shipper', desc: 'Shipped 10 moves', earned: ships >= 10, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
    { id: 'core', icon: Shield, name: 'Core Member', desc: 'Verified Profile', earned: true, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20' },
    { id: 'elite', icon: Crown, name: 'Elite Status', desc: 'Level 10 reached', earned: xp >= 4000, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
  ];

  return (
    <div className="mb-8 p-6 bg-white dark:bg-[#1f1f23] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-violet-500" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Trophy Case</h3>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {badges.map(badge => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className={`relative group shrink-0 w-24 h-28 flex flex-col items-center justify-center p-3 rounded-2xl border ${badge.earned ? badge.bg : 'bg-slate-50 dark:bg-[#111113] border-slate-200 dark:border-white/5 opacity-40 grayscale'} transition-all hover:scale-105`}
            >
              <div className={`p-2.5 rounded-full mb-2 ${badge.earned ? 'bg-white dark:bg-[#1f1f23] shadow-sm' : 'bg-transparent'} ${badge.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-center leading-tight text-slate-700 dark:text-zinc-300">
                {badge.name}
              </span>

              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-max px-3 py-1.5 bg-slate-900 dark:bg-black text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                {badge.desc}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-black rotate-45" />
              </div>
            </div>
          );
        })}
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
