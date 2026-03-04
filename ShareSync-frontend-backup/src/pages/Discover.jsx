// src/pages/Discover.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ALGORITHMIC FEED - PHASE 5.3: Categorized Discover Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Loader2, Globe } from 'lucide-react';
import { useIsMobile } from '../hooks/useMobile';

import { getAlgorithmicFeed } from '../api/discovery';

import TeamStories from '../components/ecosystem/TeamStories';
import DiscoverDashboard from '../components/discover/DiscoverSections'; // ⭐ PHASE 5.3: New Dashboard View
import FeaturedProjects from '../components/ecosystem/FeaturedProjects';
import { formatActivityItems } from '../utils/formatActivityText';

export default function Discover() {
  const isMobile = useIsMobile();
  
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  const loaderRef = useRef(null);
  const cursorRef = useRef(null);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchNextPage = useCallback(async () => {
    if (fetchingRef.current || !hasMoreRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const { items, nextCursor } = await getAlgorithmicFeed({ cursor: cursorRef.current, limit: 10 });
      
      cursorRef.current = nextCursor;
      hasMoreRef.current = !!nextCursor;

      setFeed(prev => {
        const newFeed = [...prev];
        if (items && items.length > 0) {
          items.forEach(item => newFeed.push(item));
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

  // Initial load
  useEffect(() => {
    fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Infinite Scroll Trigger
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
    
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] pb-24 transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
              Discover
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              The heartbeat of the network 🌐
            </p>
          </div>
        </div>

        <div className="mb-8">
          <TeamStories />
        </div>

        <div className="space-y-6">
          {/* Empty State Rendering */}
          {feed.length === 0 && initialLoadDone && !loading ? (
            <div className="space-y-8">
              <FeaturedProjects maxVisible={3} />
              <div className="text-center py-16 px-6 border-2 border-dashed border-slate-200 dark:border-white/[0.06] rounded-3xl bg-white/50 dark:bg-[#1f1f23]/50">
                <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Globe className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2">It's quiet out here...</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  No public projects found in the network yet. Make sure your projects are set to <strong>Public</strong> to see them in the algorithmic feed!
                </p>
              </div>
            </div>
          ) : (
            // ⭐ PHASE 5.3: Rich Dashboard Layout
            <DiscoverDashboard feed={formatActivityItems(feed)} />
          )}
          
          <div ref={loaderRef} className="w-full flex justify-center py-8">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                Calculating algorithmic updates...
              </div>
            ) : !hasMoreRef.current && feed.length > 0 ? (
              <p className="text-sm font-medium text-slate-400">You've caught up on everything!</p>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
