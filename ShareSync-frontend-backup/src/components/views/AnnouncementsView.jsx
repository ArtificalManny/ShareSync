// src/components/views/AnnouncementsView.jsx
import React from 'react';
import { Megaphone } from 'lucide-react';

export default function AnnouncementsView() {
  return (
    <div className="p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-[#09090b] min-h-[400px] rounded-xl border border-slate-200 dark:border-white/10 mt-6">
      <div className="w-16 h-16 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center mb-4">
        <Megaphone className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2">Announcements</h2>
      <p className="text-slate-500 dark:text-zinc-400 max-w-md">
        Broadcast important updates to your team and project spectators.
      </p>
    </div>
  );
}
