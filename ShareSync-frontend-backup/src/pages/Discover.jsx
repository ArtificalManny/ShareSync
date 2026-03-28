// src/pages/Discover.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ALGORITHMIC FEED - PHASE 2 POLISH (Gebbia-Grade Visuals)
// Features: Staggered loads, display typography, premium empty state.
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
        
        if (items && items.length > 0) {
          items.forEach((item, idx) => {
            const absoluteIndex = currentLength + idx + 1;
            
            // Variable Reward Slots
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

  useEffect(() => {
    fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver]);

  return (
    <div className="min-h-screen bg-surface-primary pb-24 transition-colors">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        
        <div className="flex items-center gap-4 mb-10 dashboard-section">
          <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-[32px] font-black text-text-primary tracking-tight leading-tight">
              The Arena
            </h1>
            <p className="text-[14px] font-bold text-text-tertiary tracking-wide uppercase mt-1">
              Live Network Heartbeat
            </p>
          </div>
        </div>

        <div className="mb-8 dashboard-section" style={{ animationDelay: '0.1s' }}>
          <TeamStories />
        </div>

        <div className="space-y-6 dashboard-section" style={{ animationDelay: '0.2s' }}>
          {feed.length === 0 && initialLoadDone && !loading ? (
            <div className="space-y-8">
              <FeaturedProjects maxVisible={3} />

              <div className="card-surface text-center py-20 px-6 border border-dashed border-border-default">
                <div className="w-20 h-20 bg-surface-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-border-default">
                  <Globe className="w-10 h-10 text-text-tertiary" />
                </div>
                <h3 className="text-[20px] font-black text-text-primary tracking-tight mb-3">It's quiet out here...</h3>
                <p className="text-[15px] font-medium text-text-secondary max-w-sm mx-auto leading-relaxed">
                  No public projects found in the network yet. Make sure your projects are set to <strong className="text-text-primary">Public</strong> to see them in the algorithmic feed!
                </p>
              </div>
            </div>
          ) : (
            <ActivityFeed activities={formatActivityItems(feed.filter(item => {
              const name = item.user?.displayName || item.user?.username || item.user || '';
              return name !== 'demo' && name !== 'Demo User';
            }))} />
          )}
          
          <div ref={loaderRef} className="w-full flex justify-center py-10">
            {loading ? (
              <div className="flex items-center gap-3 text-text-secondary font-bold text-[13px] uppercase tracking-wider">
                <Loader2 className="w-5 h-5 animate-spin text-brand" />
                Calculating algorithmic updates...
              </div>
            ) : !hasMoreRef.current && feed.length > 0 ? (
              <p className="text-[13px] font-bold text-text-tertiary uppercase tracking-wider">You've caught up on everything!</p>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
