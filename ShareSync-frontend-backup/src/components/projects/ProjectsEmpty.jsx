// src/components/projects/ProjectsEmpty.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE - Contrast Audit
// Muted the illustration and secondary text significantly so the user naturally
// flows toward the "Create Project" CTA.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import Button from '../ui/Button.jsx';
import { Plus } from 'lucide-react';

export default function ProjectsEmpty({ onCreate }) {
  return (
    <div
      className="rounded-3xl bg-white p-12 text-center border border-slate-200/60 shadow-sm max-w-2xl mx-auto"
    >
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        className="mx-auto mb-6 text-slate-200"
        aria-hidden="true"
      >
        <rect x="8" y="16" width="56" height="40" rx="8" fill="currentColor" opacity="0.4" />
        <rect x="16" y="24" width="40" height="8" rx="4" fill="currentColor" opacity="0.6" />
        <rect x="16" y="36" width="24" height="8" rx="4" fill="currentColor" opacity="0.6" />
      </svg>

      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        No projects yet
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
        Create your first project to kick off planning, tasks, and updates. Your mission control starts here.
      </p>

      <Button variant="primary" onClick={onCreate} className="inline-flex items-center gap-2">
        <Plus strokeWidth={2} className="w-4 h-4 shrink-0 relative -top-[0.5px]" />
        Create Project
      </Button>
    </div>
  );
}
