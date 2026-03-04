// src/components/profile/ShipLog.jsx
import React from 'react';
import { CheckCircle2, Flame, ArrowUpCircle, Trophy, Target } from 'lucide-react';

export default function ShipLog({ events = [] }) {
  // Demo timeline fallback if no real events are passed in yet
  const log = events.length > 0 ? events : [
    { id: 1, type: 'milestone', title: '7 Day Streak Reached!', date: 'Today, 2:00 PM', icon: Flame, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/20' },
    { id: 2, type: 'task', title: 'Shipped "Auth System Update"', date: 'Today, 1:45 PM', icon: CheckCircle2, color: 'text-teal-500 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-500/20' },
    { id: 3, type: 'levelup', title: 'Reached Level 12', date: 'Yesterday, 4:30 PM', icon: ArrowUpCircle, color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/20' },
    { id: 4, type: 'task', title: 'Shipped "Database Schema Migration"', date: 'Yesterday, 10:15 AM', icon: CheckCircle2, color: 'text-teal-500 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-500/20' },
    { id: 5, type: 'milestone', title: 'First Project Completed', date: '3 days ago', icon: Trophy, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20' },
  ];

  return (
    <div 
      className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10" 
      style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
    >
      <div className="flex items-center gap-2 mb-8">
        <Target className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Ship Log</h3>
      </div>
      
      <div className="relative pl-4 border-l-2 border-slate-100 dark:border-white/5 space-y-7 ml-2">
        {log.map((item, index) => (
          <div key={item.id} className="relative group">
            {/* The Timeline Node */}
            <div className={`absolute -left-[27px] p-1 rounded-full bg-white dark:bg-[#1f1f23] transition-transform duration-300 group-hover:scale-110`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${item.bg}`}>
                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
            </div>
            
            {/* The Content */}
            <div className="pl-6 pt-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-white transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400">
                {item.title}
              </p>
              <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                {item.date}
              </p>
            </div>
          </div>
        ))}
        
        {/* Soft fade out at bottom of timeline */}
        <div className="absolute -bottom-6 -left-[2px] w-1 h-16 bg-gradient-to-b from-slate-100 dark:from-white/5 to-transparent" />
      </div>
    </div>
  );
}
