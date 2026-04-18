// src/components/ecosystem/ProjectsOverview.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ChevronRight, Plus, Target, AlertCircle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const ProjectsOverview = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { default: client } = await import('../../api/client');
        const { data } = await client.get('/projects');
        const items = Array.isArray(data) ? data : (data?.data || data?.projects || []);
        if (!cancelled) {
          setProjects(items.slice(0, 5).map(p => ({
            _id: p._id || p.id,
            name: p.name || p.title || 'Untitled',
            emoji: p.emoji || p.icon || '📁',
            progress: p.metrics?.totalTasks > 0
              ? Math.round((p.metrics.completedTasks || 0) / p.metrics.totalTasks * 100)
              : 0,
            streak: p.streakDays || 0,
            nextTask: null,
            isAtRisk: (p.metrics?.weeklyShips || 0) === 0 && (p.metrics?.totalTasks || 0) > 5,
          })));
        }
      } catch (err) {
        console.warn('[ProjectsOverview] Failed to load:', err?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const getProgressColor = (progress, isAtRisk) => {
    if (isAtRisk) return 'bg-warning';
    if (progress >= 70) return 'bg-success';
    if (progress >= 40) return 'bg-brand';
    return 'bg-warning';
  };

  return (
    <div className="h-full rounded-2xl bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-text-primary">Active Projects</h3>
            {!isMobile && <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary">Your current focus</p>}
          </div>
        </div>
        <button onClick={() => navigate('/projects/new')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-surface-2 text-slate-700 dark:text-text-secondary hover:bg-violet-600 hover:text-white transition-colors">
          <Plus className="w-4 h-4" />
          {!isMobile && "New"}
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
        {projects.map(project => {
          const isImpressiveStreak = project.streak >= 7;
          return (
            <div key={project._id} onClick={() => navigate(`/projects/${project._id}`)} className={`group flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-surface-2 transition-colors duration-200 ${project.isAtRisk ? 'border-l-4 border-l-warning' : 'border-l-4 border-l-transparent'}`}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-2xl shrink-0">{project.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-text-primary truncate group-hover:text-violet-600 transition-colors">{project.name}</h4>
                  {project.isAtRisk ? (
                    <p className="text-xs font-semibold text-warning mt-0.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Needs next step</p>
                  ) : project.nextTask ? (
                    <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary mt-0.5 truncate">→ {project.nextTask}</p>
                  ) : null}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 w-28 shrink-0">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-surface-3 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.progress, project.isAtRisk)}`} style={{ width: `${project.progress}%` }} />
                </div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-text-tertiary w-8 text-right">{project.progress}%</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {!project.isAtRisk && isImpressiveStreak && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-orange-500 bg-orange-50 dark:bg-warning/10 px-2 py-1 rounded-md">
                    <Flame className="w-3.5 h-3.5" />
                    {project.streak}d
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-slate-400 dark:text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-white/[0.06]">
        <button onClick={() => navigate('/projects')} className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-text-tertiary hover:text-violet-600 dark:hover:text-text-primary hover:bg-slate-50 dark:hover:bg-surface-2 transition-all">
          View All Projects
        </button>
      </div>
    </div>
  );
};

export default ProjectsOverview;
