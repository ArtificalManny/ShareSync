// src/components/project/ActivityFeed.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 5: Quiet Confidence
// ═══════════════════════════════════════════════════════════════════════════════
// FIXED: Hardcoded slate/purple colors → Design tokens
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  CheckCircle2, Upload, Trash2, MessageCircle, DollarSign,
  Mail, UserPlus, UserMinus, Megaphone, Rocket, FileText,
  Clock, RefreshCw, ChevronDown, Filter
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';
import BottomSheet from '../mobile/BottomSheet';

/* ─────────────────────────────────────────────────────────────────────────
   ICON CONFIG - Using semantic colors
───────────────────────────────────────────────────────────────────────── */
const actionIcons = {
  'task_created': { icon: CheckCircle2, color: 'text-info' },
  'task_completed': { icon: CheckCircle2, color: 'text-success' },
  'task_deleted': { icon: Trash2, color: 'text-danger' },
  'file_uploaded': { icon: Upload, color: 'text-brand' },
  'file_deleted': { icon: Trash2, color: 'text-danger' },
  'message_sent': { icon: MessageCircle, color: 'text-info' },
  'payment_sent': { icon: DollarSign, color: 'text-success' },
  'email_exchanged': { icon: Mail, color: 'text-warning' },
  'member_added': { icon: UserPlus, color: 'text-success' },
  'member_removed': { icon: UserMinus, color: 'text-warning' },
  'announcement_created': { icon: Megaphone, color: 'text-brand' },
  'project_shipped': { icon: Rocket, color: 'text-brand' },
  'comment_added': { icon: FileText, color: 'text-text-tertiary' },
  'default': { icon: Clock, color: 'text-text-tertiary' },
};

const ActivityFeed = ({ projectId }) => {
  const isMobile = useIsMobile();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const observerTarget = useRef(null);

  useEffect(() => {
    fetchActivities(true);
  }, [projectId, filter]);

  const fetchActivities = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      
      const response = await fetch(
        `http://localhost:3000/api/projects/${projectId}/activity?type=${filter}&limit=20&page=${currentPage}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        console.warn('Activity fetch failed:', response.status);
        setActivities([]);
        return;
      }
      
      const data = await response.json();
      
      if (reset) {
        setActivities(data.activities || []);
        setPage(1);
      } else {
        setActivities(prev => [...prev, ...(data.activities || [])]);
      }
      
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Activity fetch error:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchActivities(false);
    }
  }, [loading, hasMore]);

  const handleTouchStart = (e) => {
    if (!isMobile || containerRef.current?.scrollTop > 0) return;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isMobile || containerRef.current?.scrollTop > 0) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;
    if (distance > 0 && distance < 150) {
      setIsPulling(true);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isMobile) return;
    if (pullDistance > 80) await fetchActivities(true);
    setIsPulling(false);
    setPullDistance(0);
  };

  useEffect(() => {
    if (!isMobile) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore();
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore, loading, loadMore, isMobile]);

  const getActivityIcon = (action) => {
    const config = actionIcons[action] || actionIcons.default;
    const Icon = config.icon;
    return <Icon className={`w-4 h-4 ${config.color}`} />;
  };

  const getActivityText = (activity) => {
    const userName = activity.userId?.name || 'Someone';
    switch(activity.action) {
      case 'task_created': return `${userName} created task "${activity.metadata?.taskTitle || 'Untitled'}"`;
      case 'task_completed': return `${userName} completed "${activity.metadata?.taskTitle || 'task'}"`;
      case 'file_uploaded': return `${userName} uploaded ${activity.metadata?.fileName || 'a file'}`;
      case 'payment_sent': return `${userName} sent payment to ${activity.metadata?.recipientName || 'recipient'}`;
      case 'email_exchanged': return `${userName} exchanged email with ${activity.metadata?.recipientName || 'someone'}`;
      case 'message_sent': return `${userName} sent a message`;
      case 'member_added': return `${userName} added ${activity.metadata?.memberName || 'a member'}`;
      case 'announcement_created': return `${userName} posted an announcement`;
      case 'project_shipped': return `${userName} shipped: ${activity.details?.description || 'update'}`;
      default: return `${userName} performed an action`;
    }
  };

  const getTimeAgo = (date) => {
    try {
      const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
      return `${Math.floor(seconds / 604800)}w ago`;
    } catch { return 'recently'; }
  };

  const filterOptions = [
    { id: 'all', label: 'All', icon: Clock },
    { id: 'task', label: 'Tasks', icon: CheckCircle2 },
    { id: 'file', label: 'Files', icon: Upload },
    { id: 'message', label: 'Messages', icon: MessageCircle },
    { id: 'payment', label: 'Payments', icon: DollarSign }
  ];

  return (
    <div className={`h-full flex flex-col bg-surface-1 border border-white/[0.06] ${isMobile ? 'rounded-none border-x-0' : 'rounded-xl'} overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm flex items-center gap-2 text-text-primary">
            <Clock className="w-4 h-4 text-brand" />
            Activity Feed
          </h3>
          <button
            onClick={() => fetchActivities(true)}
            disabled={loading}
            className="text-xs text-brand hover:text-brand/80 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {!isMobile && 'Refresh'}
          </button>
        </div>

        {/* Filter Buttons */}
        {isMobile ? (
          <button
            onClick={() => setShowFilterSheet(true)}
            className="w-full px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between"
          >
            <span className="flex items-center gap-2 text-text-secondary">
              <Filter className="w-4 h-4" />
              {filterOptions.find(f => f.id === filter)?.label || 'All'}
            </span>
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          </button>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterOptions.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  filter === f.id
                    ? 'bg-brand text-white'
                    : 'bg-surface-2 text-text-tertiary hover:bg-surface-3 hover:text-text-secondary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pull to Refresh */}
      {isMobile && isPulling && (
        <div 
          className="flex items-center justify-center py-2 bg-brand/10 transition-all"
          style={{ height: `${Math.min(pullDistance, 60)}px` }}
        >
          <RefreshCw 
            className={`w-4 h-4 text-brand ${pullDistance > 80 ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      )}

      {/* Activity List */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-y-auto p-4 space-y-2 ${isMobile ? 'mobile-scroll' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading && activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary text-sm">No activity yet</p>
            <p className="text-text-tertiary text-xs mt-1">Actions will appear here as you work</p>
          </div>
        ) : (
          <>
            {activities.map((activity) => (
              <div
                key={activity._id}
                className={`flex gap-3 p-3 bg-surface-0 border border-white/[0.04] rounded-lg hover:bg-surface-2 transition-colors ${isMobile ? 'active:scale-[0.98]' : ''}`}
              >
                <div className="mt-0.5">{getActivityIcon(activity.action)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary leading-relaxed">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {getTimeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {isMobile && hasMore && (
              <div ref={observerTarget} className="flex items-center justify-center py-4">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                ) : (
                  <p className="text-xs text-text-tertiary">Scroll for more...</p>
                )}
              </div>
            )}

            {!isMobile && hasMore && !loading && (
              <button
                onClick={loadMore}
                className="w-full py-2 text-xs text-brand hover:text-brand/80 transition-colors"
              >
                Load more...
              </button>
            )}
          </>
        )}
      </div>

      {/* Mobile Filter Sheet */}
      {isMobile && (
        <BottomSheet
          isOpen={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          title="Filter Activity"
          height="auto"
        >
          <div className="p-4 space-y-2">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => { setFilter(option.id); setShowFilterSheet(false); }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  filter === option.id
                    ? 'bg-brand/10 border-brand/30 text-text-primary'
                    : 'bg-surface-1 border-white/[0.06] text-text-secondary active:scale-[0.98]'
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{option.label}</span>
                {filter === option.id && (
                  <CheckCircle2 className="w-4 h-4 text-brand ml-auto" />
                )}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default ActivityFeed;
