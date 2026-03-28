// src/pages/Discover.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ALGORITHMIC FEED - PHASE 3: LIVE WIRING (With Gallery Walk Polish)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Loader2, Globe } from 'lucide-react';
import { useIsMobile } from '../hooks/useMobile';

import { getAlgorithmicFeed } from '../api/discovery';

import TeamStories from '../components/ecosystem/TeamStories';
import ActivityFeed from '../components/ecosystem/ActivityFeed';
import Achievements from '../components/ecosystem/Achievements';
import ProjectsOverview from '../components/ecosystem/ProjectsOverview';
import BurnoutAlert from '../components/ecosystem/BurnoutAlert';
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
      const { items, nextCursor } = await getAlgorithmicFeed({ 
        cursor: cursorRef.current, 
        limit: 10 
      });
      
      cursorRef.current = nextCursor;
      hasMoreRef.current = !!nextCursor;

      setFeed(prev => {
        const newFeed = [...prev];
        const currentLength = prev.filter(i => i.type !== 'interstitial').length;
        
        // Only inject interstitials if there are actual items returned
        if (items && items.length > 0) {
          items.forEach((item, idx) => {
            const absoluteIndex = currentLength + idx + 1;
            
            // 🎰 VARIABLE REWARD SLOTS
            if (absoluteIndex === 7) {
              newFeed.push({ id: `interstitial-7`, type: 'interstitial', component: <Achievements /> });
            } else if (absoluteIndex === 15) {
              newFeed.push({ id: `interstitial-15`, type: 'interstitial', component: <ProjectsOverview /> });
            } else if (absoluteIndex === 22) {
              newFeed.push({ id: `interstitial-22`, type: 'interstitial', component: <BurnoutAlert demoMode={true} /> });
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
    <div 
      className="min-h-screen pb-24 transition-colors"
      style={{ background: 'var(--bg-page, linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%))' }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        
        {/* HERO SECTION - Enhanced Typography & Shadows */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 border border-white/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Discover
            </h1>
            <p className="text-[15px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              The heartbeat of the network 🌐
            </p>
          </div>
        </div>

        <div className="mb-8">
          <TeamStories />
        </div>

        <div className="space-y-6">
          {/* 🚨 NEW: Safe Empty State Rendering */}
          {feed.length === 0 && initialLoadDone && !loading ? (
            <div className="space-y-8">
              {/* ✅ Priority 1: Featured projects for empty feed */}
              <FeaturedProjects maxVisible={3} />

              <div className="text-center py-16 px-6 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-3xl bg-white/60 dark:bg-[#1f1f23]/60 backdrop-blur-sm shadow-sm">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-200 dark:border-white/5 shadow-inner">
                  <Globe className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-[20px] font-black text-slate-900 dark:text-white mb-2 tracking-tight">It's quiet out here...</h3>
                <p className="text-[14px] font-medium text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  No public projects found in the network yet. Make sure your projects are set to <strong className="text-slate-900 dark:text-white">Public</strong> to see them in the algorithmic feed!
                </p>
              </div>
            </div>
          ) : (
            <ActivityFeed activities={formatActivityItems(feed.filter(item => {
              const name = item.user?.displayName || item.user?.username || item.user || '';
              return name !== 'demo' && name !== 'Demo User';
            }))} />
          )}
          
          <div ref={loaderRef} className="w-full flex justify-center py-8">
            {loading ? (
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white dark:bg-[#1f1f23] shadow-md border border-slate-200 dark:border-white/10 text-[13px] font-bold text-slate-600 dark:text-slate-300">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                Calculating algorithmic updates...
              </div>
            ) : !hasMoreRef.current && feed.length > 0 ? (
              <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-6 py-2 bg-slate-100 dark:bg-white/5 rounded-full">
                You've caught up on everything!
              </p>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
