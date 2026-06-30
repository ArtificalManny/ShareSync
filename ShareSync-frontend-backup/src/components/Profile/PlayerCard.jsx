// src/components/profile/PlayerCard.jsx
import React from 'react';
import { ShieldCheck, Star, Edit3, Zap } from 'lucide-react';

export default function PlayerCard({
  user, name, level, xp, nextLevelXp, currentLevelXp, archetype, isOwnProfile, onEditClick, avatarComponent
}) {
  const progress = Math.min(100, Math.max(0, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));

  return (
    <div className="relative w-full bg-white dark:bg-[#1f1f23] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden mb-8">
      {/* Background FX Header */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 dark:from-violet-500/20 dark:via-fuchsia-500/20 dark:to-cyan-500/20" />

      <div className="relative p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Avatar Component injected from parent */}
        <div className="shrink-0 -mt-2 z-10">
           {avatarComponent}
        </div>

        <div className="flex-1 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
             <div>
               <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white tracking-tight">
                 {name.fullName || user?.email?.split('@')[0] || 'Loading...'}
               </h1>
               <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
                 <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                   Lvl {level}
                 </span>
                 <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm shadow-teal-500/20"
                   style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 Available)' }}
                 >
                   <ShieldCheck className="w-3.5 h-3.5" />
                   Core Verified
                 </span>
                 {archetype && (
                   <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-medium border border-violet-200 dark:border-violet-500/20">
                     <Star className="w-3.5 h-3.5" />
                     {archetype}
                   </span>
                 )}
               </div>
             </div>

             {/* Action Button */}
             {isOwnProfile && (
               <button
                 onClick={onEditClick}
                 className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/20 hover:shadow-lg hover:-translate-y-0.5"
                 style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB Available)' }}
               >
                 <Edit3 className="w-4 h-4" />
                 Edit Profile
               </button>
             )}
          </div>

          {user?.bio && (
            <p className="text-slate-600 dark:text-zinc-300 max-w-2xl text-sm leading-relaxed mb-6 mt-4">
              {user.bio}
            </p>
          )}

          {/* Animated XP Progress Bar */}
          <div className={`mt-8 bg-slate-50 dark:bg-[#111113] rounded-2xl p-5 border border-slate-100 dark:border-white/5 ${!user?.bio && 'mt-12'}`}>
            <div className="flex justify-between items-end mb-3">
               <div className="flex items-center gap-2">
                 <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                 <span className="text-sm font-bold text-slate-700 dark:text-zinc-200">XP Progress</span>
               </div>
               <div className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                 <span className="text-violet-600 dark:text-violet-400">{xp}</span> / {nextLevelXp} XP
               </div>
            </div>
            
            <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
               <div
                 className="h-full rounded-full transition-all duration-1000 ease-out"
                 style={{
                   width: `${progress}%`,
                   background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 Available)',
                   boxShadow: '0 0 10px rgba(236, 72, 153, 0.5)'
                 }}
               />
            </div>
            
            <div className="mt-2 text-[10px] text-right text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
              {nextLevelXp - xp} XP to Level {level + 1}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
