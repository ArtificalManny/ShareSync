// src/components/empty-states/EmptyProjects.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4.1: Empty States That Sell - Empty Projects
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Plus, Download } from 'lucide-react';
import { OPENSHARE_MESSAGING } from '../../content/openShareMessaging';
import {
  trackFirstRunExplanationViewed,
  trackFirstProjectStarted,
} from '../../utils/telemetry';

export default function EmptyProjects({ onCreateProject, onImport }) {
  useEffect(() => {
    const storageKey =
      'openshare:first-run-explanation-viewed';

    let alreadyTracked = false;

    try {
      alreadyTracked =
        sessionStorage.getItem(storageKey) === '1';

      if (!alreadyTracked) {
        sessionStorage.setItem(storageKey, '1');
      }
    } catch {
      // Analytics must never block the first-run experience.
    }

    if (!alreadyTracked) {
      trackFirstRunExplanationViewed({
        entry_point: 'empty_projects',
      });
    }
  }, []);

  const handleCreateProject = () => {
    const flow = {
      project_entry_point: 'empty_projects',
      creation_method: 'blank',
    };

    let alreadyTracked = false;

    try {
      alreadyTracked =
        sessionStorage.getItem(
          'openshare:first-project-started',
        ) === '1';

      sessionStorage.setItem(
        'openshare:first-project-flow',
        JSON.stringify(flow),
      );

      if (!alreadyTracked) {
        sessionStorage.setItem(
          'openshare:first-project-started',
          '1',
        );
      }
    } catch {
      // Analytics must never block project creation.
    }

    if (!alreadyTracked) {
      trackFirstProjectStarted(flow);
    }

    onCreateProject?.();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center px-4 py-20 text-center"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 scale-150 rounded-full bg-brand-500/20 blur-2xl" />

        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/[0.08] bg-surface-2 shadow-2xl">
          <Rocket className="h-12 w-12 text-brand-400" />
        </div>
      </div>

      <span className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-400">
        Welcome to OpenShare
      </span>

      <h2 className="mb-4 text-3xl font-bold text-text-primary">
        Build your first project command center
      </h2>

      <p className="mb-3 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">
        {OPENSHARE_MESSAGING.plainEnglish}
      </p>

      <p className="mb-10 max-w-lg text-sm leading-6 text-text-tertiary sm:text-base">
        {OPENSHARE_MESSAGING.brandBridge}
      </p>

      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleCreateProject}
          className="btn-primary flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          Create your first project
        </button>

        <button
          onClick={onImport}
          className="group flex items-center gap-2 text-sm font-medium text-text-tertiary transition-colors hover:text-brand-400"
        >
          <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          Import from Asana/Trello
        </button>
      </div>
    </motion.section>
  );
}
