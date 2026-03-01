// src/components/ecosystem/FeaturedProjects.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 1: Featured Projects — shown in Discover when feed is empty
// Gives new users something to explore instead of a blank page
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Star, Users, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import client from '../../api/client';

// ── Fallback featured projects if backend returns nothing ────────────────
const FALLBACK_FEATURED = [
  {
    id: 'demo-1',
    name: 'ShareSync Platform',
    description: 'The project management tool that builds momentum',
    emoji: '🚀',
    memberCount: 12,
    shipCount: 34,
    tags: ['saas', 'productivity'],
  },
  {
    id: 'demo-2',
    name: 'Design System v2',
    description: 'Component library with dark mode and animations',
    emoji: '🎨',
    memberCount: 5,
    shipCount: 18,
    tags: ['design', 'ui'],
  },
  {
    id: 'demo-3',
    name: 'AI Study Buddy',
    description: 'Flashcards that adapt to your learning pace',
    emoji: '🧠',
    memberCount: 3,
    shipCount: 8,
    tags: ['ai', 'education'],
  },
];

export default function FeaturedProjects({ maxVisible = 3 }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await client.get('/projects/featured', { params: { limit: maxVisible } });
        const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        if (!cancelled) {
          setProjects(items.length > 0 ? items.slice(0, maxVisible) : FALLBACK_FEATURED);
        }
      } catch (err) {
        // Endpoint may not exist yet — use fallbacks silently
        if (!cancelled) setProjects(FALLBACK_FEATURED);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [maxVisible]);

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
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
          Featured Projects
        </h3>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 gap-3">
        {projects.map((project) => {
          const pid = project._id || project.id;
          const isDemo = pid?.startsWith('demo-');

          return (
            <button
              key={pid}
              onClick={() => !isDemo && navigate(`/projects/${pid}`)}
              className={`
                w-full text-left p-5 rounded-2xl
                bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06]
                hover:border-violet-300 dark:hover:border-violet-500/30
                hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-none
                transition-all duration-200 group
                ${isDemo ? 'cursor-default' : 'cursor-pointer'}
              `}
              style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
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
                    {(project.shipCount || 0) >= 10 && (
                      <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>

                  {project.description && (
                    <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-1 mb-2">
                      {project.description}
                    </p>
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
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                {!isDemo && (
                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors shrink-0 mt-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
