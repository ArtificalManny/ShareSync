// src/components/ecosystem/TeamStories.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// LIVE SHIPPING TICKER — Replaces Instagram-style stories
// Shows real-time ship updates from public projects in a horizontal scroll
// Think: GitHub activity feed meets Product Hunt's "Launching Now" bar
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, TrendingUp, CheckCircle, Zap, ArrowRight,
  ChevronLeft, ChevronRight, Radio,
} from 'lucide-react';
import { getAlgorithmicFeed } from '../../api/discovery';

const ICON_MAP = {
  Rocket: Rocket,
  TrendingUp: TrendingUp,
  CheckCircle: CheckCircle,
  Sparkles: Zap,
};

const COLOR_MAP = {
  purple: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-500/20', dot: 'bg-violet-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
  blue: { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-500/20', dot: 'bg-sky-500' },
  orange: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20', dot: 'bg-amber-500' },
};

function timeAgo(ts) {
  if (!ts) return '';
  if (typeof ts === 'string' && ts.includes('ago')) return ts;
  const d = Date.now() - new Date(ts).getTime();
  if (isNaN(d) || d < 0) return '';
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (m < 1) return 'now';
  if (m < 60) return m + 'm ago';
  if (h < 24) return h + 'h ago';
  return dy + 'd ago';
}

function ShipCard({ item }) {
  const navigate = useNavigate();
  const c = COLOR_MAP[item.color] || COLOR_MAP.purple;
  const IconComp = ICON_MAP[item.icon] || Rocket;

  return (
    <div className="flex-shrink-0 w-[280px] group">
      <div className={
        'p-4 rounded-xl border transition-all duration-200 cursor-pointer '
        + 'bg-white dark:bg-[#1f1f23] border-slate-200 dark:border-white/[0.06] '
        + 'hover:border-violet-300 dark:hover:border-violet-500/25 hover:shadow-md hover:shadow-violet-100/40 dark:hover:shadow-none '
        + 'hover:-translate-y-0.5 active:translate-y-0'
      }>
        {/* Top: icon + user + time */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + c.bg}>
            <IconComp className={'w-4 h-4 ' + c.text} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{item.displayName || item.userName || item.user}</p>
            <p className="text-[10px] text-slate-400 dark:text-white/30">{timeAgo(item.timestamp)}</p>
          </div>
          <div className={'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + c.dot} />
        </div>

        {/* Content */}
        <p className="text-[13px] text-slate-700 dark:text-white/70 leading-snug mb-2 line-clamp-2">
          {item.content || (item.action + ' ' + item.project)}
        </p>

        {/* Project tag */}
        <div className="flex items-center justify-between">
          <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ' + c.bg + ' ' + c.text + ' ' + c.border}>
            {item.project}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-300 dark:text-white/15 group-hover:text-violet-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}

export default function TeamStories({ items: externalItems, loading = false } = {}) {
  const scrollRef = useRef(null);
  const [items, setItems] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const hasExternalItems = Array.isArray(externalItems);
  const visibleItems = (hasExternalItems ? externalItems : items).filter(
    (item) => item && item.type !== 'interstitial'
  );

  // Load real feed data when the parent did not provide it.
  useEffect(() => {
    if (hasExternalItems) return undefined;

    let mounted = true;
    getAlgorithmicFeed({ limit: 8 })
      .then(({ items: feedItems }) => {
        if (mounted) {
          setItems(Array.isArray(feedItems) ? feedItems : []);
        }
      })
      .catch(() => {
        if (mounted) setItems([]);
      });
    return () => { mounted = false; };
  }, [hasExternalItems]);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    updateScrollButtons();
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [visibleItems.length]);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white">
            Shipping Now
          </h3>
        </div>

        {/* Scroll arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable ticker */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <style>{`.flex::-webkit-scrollbar { display: none; }`}</style>
        {loading && visibleItems.length === 0 ? (
            <div className="w-full rounded-xl border border-dashed border-slate-200 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-8 text-center text-sm font-medium text-slate-500 dark:text-zinc-400">
              Loading public shipping activity...
            </div>
          ) : visibleItems.length > 0 ? (
            visibleItems.map((item) => (
              <ShipCard key={item.id || item.projectId || item.project} item={item} />
            ))
          ) : (
            <div className="w-full rounded-xl border border-dashed border-slate-200 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-8 text-center text-sm font-medium text-slate-500 dark:text-zinc-400">
              No public shipping activity yet.
            </div>
          )}
      </div>

      {/* Fade edges */}
      {visibleItems.length > 0 && canScrollLeft && (
        <div className="absolute left-0 top-10 bottom-0 w-8 bg-gradient-to-r from-slate-50 dark:from-[#09090B] to-transparent pointer-events-none" />
      )}
      {visibleItems.length > 0 && canScrollRight && (
        <div className="absolute right-0 top-10 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-[#09090B] to-transparent pointer-events-none" />
      )}
    </div>
  );
}
