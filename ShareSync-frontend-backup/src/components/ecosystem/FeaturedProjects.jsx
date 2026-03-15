// src/components/ecosystem/FeaturedProjects.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FEATURED PROJECTS — Product Hunt-style cards with follow/spectator buttons
// Richer layout: momentum badges, progress indicators, category tags
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Star, Users, ArrowRight, Loader2,
  Flame, Eye, Zap, Bell, BellOff,
} from 'lucide-react';
import client from '../../api/client';

const FALLBACK_FEATURED = [
  { id: 'demo-1', name: 'ShareSync Platform', description: 'The project management tool that builds momentum', emoji: '🚀', memberCount: 12, shipCount: 34, tags: ['saas', 'productivity'], streak: 45, completionRate: 72 },
  { id: 'demo-2', name: 'Design System v2', description: 'Component library with dark mode and animations', emoji: '🎨', memberCount: 5, shipCount: 18, tags: ['design', 'ui'], streak: 12, completionRate: 58 },
  { id: 'demo-3', name: 'AI Study Buddy', description: 'Flashcards that adapt to your learning pace', emoji: '🧠', memberCount: 3, shipCount: 8, tags: ['ai', 'education'], streak: 7, completionRate: 35 },
];

function MomentumBadge({ streak }) {
  if (!streak || streak < 3) return null;
  const level = streak >= 30 ? 'blazing' : streak >= 14 ? 'hot' : 'building';
  const styles = {
    blazing: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    hot: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    building: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
  };
  return (
    <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ' + styles[level]}>
      <Flame className="w-3 h-3" />
      {streak}d streak
    </span>
  );
}

function ProgressBar({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
        style={{ width: clamped + '%' }}
      />
    </div>
  );
}

function ProjectCard({ project, onFollow }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const pid = project._id || project.id;
  const isDemo = pid?.startsWith('demo-');

  const handleFollow = (e) => {
    e.stopPropagation();
    setFollowing(!following);
    onFollow?.(pid, !following);
  };

  return (
    <div
      onClick={() => !isDemo && navigate('/projects/' + pid)}
      className={
        'p-5 rounded-2xl border transition-all duration-200 group '
        + 'bg-white dark:bg-[#1f1f23] border-slate-200 dark:border-white/[0.06] '
        + 'hover:border-violet-300 dark:hover:border-violet-500/25 '
        + 'hover:shadow-lg hover:shadow-violet-100/40 dark:hover:shadow-none '
        + (isDemo ? 'cursor-default' : 'cursor-pointer')
      }
    >
      <div className="flex items-start gap-4">
        {/* Emoji avatar */}
        <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center text-2xl shrink-0">
          {project.emoji || '📦'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-slate-800 dark:text-white truncate">
              {project.name || project.title}
            </h4>
            <MomentumBadge streak={project.streak || project.streakDays} />
          </div>

          {project.description && (
            <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-1 mb-3">
              {project.description}
            </p>
          )}

          {/* Progress */}
          {(project.completionRate > 0) && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-slate-400 dark:text-white/30">Progress</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-white/50">{project.completionRate}%</span>
              </div>
              <ProgressBar value={project.completionRate} />
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-zinc-500">
            {project.memberCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {project.memberCount}
              </span>
            )}
            {project.shipCount > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {project.shipCount} ships
              </span>
            )}
            {project.tags?.length > 0 && (
              <div className="flex gap-1">
                {project.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Follow button */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={handleFollow}
            className={
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border '
              + (following
                ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/[0.08]'
                : 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600 shadow-sm')
            }
          >
            {following ? <BellOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {following ? 'Following' : 'Follow'}
          </button>

          {!isDemo && (
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 group-hover:text-violet-500 transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeaturedProjects({ maxVisible = 6 }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('trending');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await client.get('/discovery/trending', { params: { limit: maxVisible } });
        const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        if (!cancelled) {
          setProjects(items.length > 0 ? items.slice(0, maxVisible).map(p => ({
            ...p,
            id: p._id || p.id,
            name: p.name || p.projectName,
            memberCount: p.metrics?.memberCount || p.memberCount || 0,
            shipCount: p.metrics?.totalShips || p.shipCount || 0,
            streak: p.streakDays || p.streak || 0,
            completionRate: p.metrics?.completedTasks && p.metrics?.totalTasks
              ? Math.round((p.metrics.completedTasks / p.metrics.totalTasks) * 100)
              : (p.completionRate || 0),
          })) : FALLBACK_FEATURED);
        }
      } catch {
        if (!cancelled) setProjects(FALLBACK_FEATURED);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [maxVisible]);

  const handleFollow = (projectId, isFollowing) => {
    // Will wire to API in step 4
    console.log(isFollowing ? 'Following' : 'Unfollowing', projectId);
  };

  const sorted = [...projects].sort((a, b) => {
    if (sortBy === 'trending') return (b.shipCount || 0) - (a.shipCount || 0);
    if (sortBy === 'newest') return 0; // preserve API order
    if (sortBy === 'streak') return (b.streak || 0) - (a.streak || 0);
    return 0;
  });

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header with sort toggles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live Ranking</span>
          </div>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06]">
          {[
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'streak', label: 'Streaks', icon: Flame },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSortBy(id)}
              className={
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all '
                + (sortBy === id
                  ? 'bg-white dark:bg-white/[0.10] text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60')
              }
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Project cards */}
      <div className="space-y-3">
        {sorted.map((project) => (
          <ProjectCard key={project._id || project.id} project={project} onFollow={handleFollow} />
        ))}
      </div>
    </div>
  );
}
