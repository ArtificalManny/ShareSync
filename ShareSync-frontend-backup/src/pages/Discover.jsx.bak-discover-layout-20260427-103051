// src/pages/Discover.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ALGORITHMIC FEED - PHASE 3: LIVE WIRING (With Empty State Fallback)
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
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Discover() {
  useDocumentTitle("Discover");
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
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
              // Pass the true stats down to the Achievements component
              newFeed.push({ 
                id: `interstitial-7`, 
                type: 'interstitial', 
                component: <Achievements 
                  currentLevel={user?.level || 1} 
                  currentXp={user?.xp || 0} 
                  currentStreak={user?.streakDays || user?.currentStreak || 0}
                  totalShips={user?.totalShips || 0}
                /> 
              });
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
  }, [user]); // Added user dependency to ensure accurate stats

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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        
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
          {/* 🚨 NEW: Safe Empty State Rendering */}
          {feed.length === 0 && initialLoadDone && !loading ? (
            <div className="space-y-8">
              {/* ✅ Priority 1: Featured projects for empty feed */}
              <FeaturedProjects maxVisible={3} />

              <div className="text-center py-16 px-6 border-2 border-dashed border-slate-200 dark:border-white/[0.06] rounded-3xl bg-white/50 dark:bg-surface-0/50">
                <div className="w-16 h-16 bg-slate-100 dark:bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Globe className="w-8 h-8 text-slate-400 dark:text-text-tertiary" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-text-primary mb-2">It's quiet out here...</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-text-tertiary max-w-sm mx-auto">
                  No public projects found in the network yet. Make sure your projects are set to <strong>Public</strong> to see them in the algorithmic feed!
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <FeaturedProjects maxVisible={6} />
              </div>
              <ActivityFeed activities={formatActivityItems(feed.filter(item => {
                const name = item.user?.displayName || item.user?.username || item.user || '';
                return name !== 'demo' && name !== 'Demo User';
              }))} />
            </>
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
