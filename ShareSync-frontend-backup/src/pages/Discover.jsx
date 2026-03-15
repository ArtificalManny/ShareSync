// src/pages/Discover.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DISCOVER — Public project discovery feed (Product Hunt meets GitHub Explore)
// Sections: Live Shipping ticker → Category filters → Featured → Algorithmic feed
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Globe, Search, Compass } from 'lucide-react';
import { useIsMobile } from '../hooks/useMobile';

import { getAlgorithmicFeed } from '../api/discovery';

import TeamStories from '../components/ecosystem/TeamStories';
import ActivityFeed from '../components/ecosystem/ActivityFeed';
import Achievements from '../components/ecosystem/Achievements';
import ProjectsOverview from '../components/ecosystem/ProjectsOverview';
import BurnoutAlert from '../components/ecosystem/BurnoutAlert';
import FeaturedProjects from '../components/ecosystem/FeaturedProjects';
import { formatActivityItems } from '../utils/formatActivityText';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'saas', label: 'SaaS' },
  { id: 'design', label: 'Design' },
  { id: 'ai', label: 'AI / ML' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'education', label: 'Education' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'open-source', label: 'Open Source' },
];

export default function Discover() {
  const isMobile = useIsMobile();
  
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const loaderRef = useRef(null);
  const cursorRef = useRef(null);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchNextPage = useCallback(async () => {
    if (fetchingRef.current || !hasMoreRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const { items, nextCursor } = await getAlgorithmicFeed({ 
        cursor: cursorRef.current, 
        limit: 10 
      });
      
      cursorRef.current = nextCursor;
      hasMoreRef.current = !!nextCursor;

      setFeed(prev => {
        const newFeed = [...prev];
        const currentLength = prev.filter(i => i.type !== 'interstitial').length;
        
        if (items && items.length > 0) {
          items.forEach((item, idx) => {
            const absoluteIndex = currentLength + idx + 1;
            
            if (absoluteIndex === 7) {
              newFeed.push({ id: 'interstitial-7', type: 'interstitial', component: <Achievements /> });
            } else if (absoluteIndex === 15) {
              newFeed.push({ id: 'interstitial-15', type: 'interstitial', component: <ProjectsOverview /> });
            } else if (absoluteIndex === 22) {
              newFeed.push({ id: 'interstitial-22', type: 'interstitial', component: <BurnoutAlert demoMode={true} /> });
            }
            
            newFeed.push(item);
          });
        }
        
        return newFeed;
      });

    } catch (e) {
      console.error(e);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setInitialLoadDone(true);
    }
  }, []);

  useEffect(() => {
    fetchNextPage();
  }, []);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && !fetchingRef.current && hasMoreRef.current) {
      fetchNextPage();
    }
  }, [fetchNextPage]);

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => { if (loaderRef.current) observer.unobserve(loaderRef.current); };
  }, [handleObserver]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] pb-24 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                Discover
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Explore public projects and follow what inspires you
              </p>
            </div>
          </div>
        </div>

        {/* ── Search Bar ────────────────────────────────────────────── */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects, teams, tags..."
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm
              bg-white dark:bg-[#1f1f23]
              border border-slate-200 dark:border-white/[0.08]
              text-slate-800 dark:text-white
              placeholder-slate-400 dark:placeholder-white/30
              focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400
              transition-shadow"
          />
        </div>

        {/* ── Live Shipping Ticker ──────────────────────────────────── */}
        <div className="mb-8">
          <TeamStories />
        </div>

        {/* ── Category Filters ──────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-8" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={
                'px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all '
                + (activeCategory === cat.id
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-white/50 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.06]')
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Featured Projects ─────────────────────────────────────── */}
        <div className="mb-10">
          <FeaturedProjects maxVisible={4} searchQuery={searchQuery} />
        </div>

        {/* ── Algorithmic Feed ──────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 rounded-full bg-violet-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wider">
              Recent Activity
            </h2>
          </div>

          {feed.length === 0 && initialLoadDone && !loading ? (
            <div className="text-center py-16 px-6 border-2 border-dashed border-slate-200 dark:border-white/[0.06] rounded-2xl bg-white/50 dark:bg-[#1f1f23]/50">
              <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7 text-slate-400 dark:text-white/20" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-2">It's quiet out here...</h3>
              <p className="text-sm text-slate-500 dark:text-white/40 max-w-sm mx-auto">
                No public projects found in the network yet. Make sure your projects are set to <strong className="text-slate-700 dark:text-white/60">Public</strong> to see them in the algorithmic feed!
              </p>
            </div>
          ) : (
            <ActivityFeed activities={formatActivityItems(feed.filter(item => {
              const name = item.user?.displayName || item.user?.username || item.user || '';
              return name !== 'demo' && name !== 'Demo User';
            }))} />
          )}
          
          <div ref={loaderRef} className="w-full flex justify-center py-8">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 dark:text-white/30 font-medium text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                Loading more...
              </div>
            ) : !hasMoreRef.current && feed.length > 0 ? (
              <p className="text-xs font-medium text-slate-400 dark:text-white/30">You're all caught up</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
