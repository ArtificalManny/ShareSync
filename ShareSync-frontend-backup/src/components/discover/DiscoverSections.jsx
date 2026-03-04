// src/components/discover/DiscoverSections.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5.3: Discover Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Activity, TrendingUp, Trophy, MessageSquare, ArrowRight } from 'lucide-react';

const SectionCard = ({ title, icon: Icon, colorClass, children, onSeeAll }) => (
  <div className="min-w-[280px] w-full md:min-w-0 snap-center shrink-0 flex flex-col bg-white dark:bg-[#1f1f23] rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-zinc-100">{title}</h3>
      </div>
      <button onClick={onSeeAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto space-y-4">
      {children}
    </div>
  </div>
);

// Very basic parsing to categorize standard feed items into sections
export default function DiscoverDashboard({ feed = [] }) {
  
  // Fake categorized slicing based on the unified feed for demonstration
  const liveItems = feed.slice(0, 3);
  const trendingItems = feed.slice(3, 6);
  const winItems = feed.filter(f => f.action === 'completed' || f.action === 'shipped').slice(0, 3);
  const discussionItems = feed.filter(f => f.action === 'commented' || f.action === 'discussed').slice(0, 3);

  // Fallback map for when filters yield zero results
  const renderItemFallback = (items, fallbackText) => {
    if (items.length > 0) {
      return items.map((item, idx) => (
        <div key={item.id || idx} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">
            {item.user?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-zinc-200 truncate">{item.user || "User"}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">{item.target || item.title || "Updated a project"}</p>
          </div>
        </div>
      ));
    }
    return <p className="text-xs text-slate-400 italic py-2">{fallbackText}</p>;
  };

  return (
    <div className="w-full">
      {/* Mobile: Horizontal Scroll with Snap
        Desktop: 2-col or 4-col Grid
      */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 md:grid md:grid-cols-2 xl:grid-cols-4 md:overflow-visible no-scrollbar">
        
        <SectionCard 
          title="Live Now" 
          icon={Activity} 
          colorClass="bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400"
          onSeeAll={() => console.log("See Live")}
        >
          {renderItemFallback(liveItems, "No active sessions right now.")}
        </SectionCard>

        <SectionCard 
          title="Trending" 
          icon={TrendingUp} 
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
          onSeeAll={() => console.log("See Trending")}
        >
          {renderItemFallback(trendingItems, "No trending projects this hour.")}
        </SectionCard>

        <SectionCard 
          title="Wins" 
          icon={Trophy} 
          colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          onSeeAll={() => console.log("See Wins")}
        >
          {renderItemFallback(winItems, "Waiting for the first ship of the day!")}
        </SectionCard>

        <SectionCard 
          title="Discussions" 
          icon={MessageSquare} 
          colorClass="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
          onSeeAll={() => console.log("See Discussions")}
        >
          {renderItemFallback(discussionItems, "It's quiet. Start a discussion.")}
        </SectionCard>

      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
