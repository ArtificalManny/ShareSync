// src/components/onboarding/CreateFirstProject.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY 1: "Create First Project" card — shown on Projects page when empty
// Uses backend templates for one-click project creation
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Rocket, Loader2, CheckCircle2, Sparkles, Code, Palette, FileText, Users } from 'lucide-react';
import { createProjectFromTemplate, createProject } from '../../api/projects';

// ── Template definitions (match backend project-templates.ts IDs) ────────
const TEMPLATES = [
  {
    id: 'side-project',
    label: 'Side Project',
    description: 'Ship a personal project with milestones',
    emoji: '🚀',
    icon: Rocket,
    color: 'violet',
  },
  {
    id: 'learning-path',
    label: 'Learning Path',
    description: 'Track what you're learning week by week',
    emoji: '📚',
    icon: FileText,
    color: 'blue',
  },
  {
    id: 'design-sprint',
    label: 'Design Sprint',
    description: 'From concept to prototype in 5 days',
    emoji: '🎨',
    icon: Palette,
    color: 'pink',
  },
  {
    id: 'team-kickoff',
    label: 'Team Kickoff',
    description: 'Align your team and start shipping',
    emoji: '👥',
    icon: Users,
    color: 'teal',
  },
];

const COLOR_MAP = {
  violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20', text: 'text-violet-700 dark:text-violet-400', ring: 'ring-violet-200 dark:ring-violet-500/20' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-500/20' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-500/10', border: 'border-pink-200 dark:border-pink-500/20', text: 'text-pink-700 dark:text-pink-400', ring: 'ring-pink-200 dark:ring-pink-500/20' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', text: 'text-teal-700 dark:text-teal-400', ring: 'ring-teal-200 dark:ring-teal-500/20' },
};

export default function CreateFirstProject({ onProjectCreated }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(null); // template id being created
  const [created, setCreated] = useState(null);    // created project

  const handleTemplateClick = useCallback(async (template) => {
    if (creating) return;
    setCreating(template.id);

    try {
      // Try template endpoint first, fall back to regular create
      let project;
      try {
        project = await createProjectFromTemplate(template.id);
      } catch (templateErr) {
        console.warn('[CreateFirstProject] Template endpoint failed, falling back to createProject:', templateErr?.message);
        project = await createProject({
          title: template.label,
          description: template.description,
        });
      }

      setCreated(project);
      onProjectCreated?.(project);

      // Navigate after brief celebration
      setTimeout(() => {
        const pid = project?._id || project?.id;
        if (pid) navigate(`/projects/${pid}`);
      }, 1500);
    } catch (err) {
      console.error('[CreateFirstProject] Failed:', err);
      setCreating(null);
    }
  }, [creating, onProjectCreated, navigate]);

  // ── Success state ──────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="p-8 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/10 border border-violet-200 dark:border-violet-500/20 text-center">
        <CheckCircle2 className="w-12 h-12 text-violet-600 dark:text-violet-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-violet-800 dark:text-violet-300 mb-2">
          Project created! 🎉
        </h3>
        <p className="text-sm text-violet-600 dark:text-violet-400">
          Taking you there now...
        </p>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
      style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}
        >
          <FolderPlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Start Your First Project</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Pick a template — you can customize everything later</p>
        </div>
        <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
          <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400">+50 XP</span>
        </div>
      </div>

      {/* Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEMPLATES.map((t) => {
          const colors = COLOR_MAP[t.color] || COLOR_MAP.violet;
          const Icon = t.icon;
          const isCreating = creating === t.id;

          return (
            <button
              key={t.id}
              onClick={() => handleTemplateClick(t)}
              disabled={!!creating}
              className={`
                p-4 rounded-xl text-left transition-all duration-200 border
                ${isCreating
                  ? `${colors.bg} ${colors.border} ring-2 ${colors.ring}`
                  : `bg-slate-50 dark:bg-zinc-800/50 border-slate-100 dark:border-white/5 hover:${colors.border} hover:${colors.bg}`
                }
                disabled:opacity-50
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                  {isCreating ? (
                    <Loader2 className={`w-4 h-4 ${colors.text} animate-spin`} />
                  ) : (
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-white">
                    {t.emoji} {t.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{t.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Blank project option */}
      <div className="mt-4 text-center">
        <button
          onClick={() => navigate('/projects?new=1')}
          disabled={!!creating}
          className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
        >
          or start with a blank project →
        </button>
      </div>
    </div>
  );
}
