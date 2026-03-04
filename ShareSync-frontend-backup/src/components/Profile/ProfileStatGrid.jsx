// src/components/profile/ProfileStatGrid.jsx
import React from 'react';
import { Rocket, Flame, Zap, FolderDot } from 'lucide-react';

const StatBox = ({ icon: Icon, label, value, colorClass, bgClass }) => (
  <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-500 ${bgClass}`} />
    
    <div className="flex items-center gap-3 mb-3 relative z-10">
      <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{label}</span>
    </div>
    
    <div className="text-3xl font-extrabold text-slate-800 dark:text-zinc-100 tabular-nums relative z-10">
      {value}
    </div>
  </div>
);

export default function ProfileStatGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatBox icon={Rocket} label="Moves" value={stats.moves} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-500/10" />
      <StatBox icon={Flame} label="Streak" value={`${stats.streak}d`} colorClass="text-orange-600 dark:text-orange-400" bgClass="bg-orange-50 dark:bg-orange-500/10" />
      <StatBox icon={Zap} label="Total XP" value={stats.xp} colorClass="text-violet-600 dark:text-violet-400" bgClass="bg-violet-50 dark:bg-violet-500/10" />
      <StatBox icon={FolderDot} label="Projects" value={stats.projects} colorClass="text-teal-600 dark:text-teal-400" bgClass="bg-teal-50 dark:bg-teal-500/10" />
    </div>
  );
}
