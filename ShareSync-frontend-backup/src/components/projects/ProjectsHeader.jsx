// src/components/projects/ProjectsHeader.jsx
import React from 'react';

export default function ProjectsHeader({
  query, onQueryChange,
  status, onStatusChange,
  owner, onOwnerChange,
  updated, onUpdatedChange,
  onCreateProject,
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Projects</h1>
        <div className="flex gap-2">
          <button
            onClick={onCreateProject}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            New Project
          </button>
        </div>
      </div>

      {/* Filter controls */}
      <div
        className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        role="group"
        aria-label="Project filters"
      >
        {/* Search */}
        <div className="flex flex-col">
          <label htmlFor="projects-search" className="sr-only">Search projects</label>
          <input
            id="projects-search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search projects…"
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-3 py-2"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col">
          <label htmlFor="projects-status" className="sr-only">Filter by status</label>
          <select
            id="projects-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-3 py-2"
          >
            <option value="all">All status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Owner */}
        <div className="flex flex-col">
          <label htmlFor="projects-owner" className="sr-only">Filter by owner</label>
          <select
            id="projects-owner"
            value={owner}
            onChange={(e) => onOwnerChange(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-3 py-2"
          >
            <option value="all">All owners</option>
            <option value="me">Owned by me</option>
            <option value="team">Owned by team</option>
          </select>
        </div>

        {/* Updated */}
        <div className="flex flex-col">
          <label htmlFor="projects-updated" className="sr-only">Filter by last updated</label>
          <select
            id="projects-updated"
            value={updated}
            onChange={(e) => onUpdatedChange(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-3 py-2"
          >
            <option value="7d">Updated in 7 days</option>
            <option value="30d">Updated in 30 days</option>
            <option value="all">Any time</option>
          </select>
        </div>
      </div>
    </div>
  );
}