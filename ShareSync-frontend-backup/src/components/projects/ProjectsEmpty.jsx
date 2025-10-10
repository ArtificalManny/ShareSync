import React from 'react';
import Button from '../ui/Button.jsx';


export default function ProjectsEmpty({ onCreate }) {
  return (
    <div
      className="rounded-2xl bg-[var(--card-bg)] dark:bg-[var(--card-bg-dark)] p-8 text-center border border-[var(--card-border)] dark:border-[var(--card-border-dark)]"
    >
      {/* Tiny inline illustration */}
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        className="mx-auto mb-4 text-[var(--icon-muted)] dark:text-[var(--icon-muted-dark)]"
        aria-hidden="true"
      >
        <rect x="8" y="16" width="56" height="40" rx="8" fill="currentColor" opacity="0.2" />
        <rect x="16" y="24" width="40" height="8" rx="4" fill="currentColor" opacity="0.35" />
        <rect x="16" y="36" width="24" height="8" rx="4" fill="currentColor" opacity="0.35" />
      </svg>

      <h2
        className="font-semibold text-[var(--heading-lg)] dark:text-[var(--heading-lg-dark)]"
        style={{ fontSize: 'var(--font-lg)', lineHeight: 'var(--leading-lg)' }}
      >
        No projects yet
      </h2>
      <p
        className="mt-1 text-[var(--body-text)] dark:text-[var(--body-text-dark)]"
        style={{ fontSize: 'var(--font-sm)', lineHeight: 'var(--leading-sm)' }}
      >
        Create your first project to kick off planning, tasks, and updates.
      </p>

      <Button variant="primary" onClick={onCreate} className="mt-5 inline-flex items-center gap-2">
        <span aria-hidden="true">＋</span>
        Create Project
      </Button>
    </div>
  );
}