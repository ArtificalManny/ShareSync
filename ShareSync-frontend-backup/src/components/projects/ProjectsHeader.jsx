// /src/components/projects/ProjectsHeader.jsx
import React from 'react';
import { Plus, Search } from 'lucide-react';

export default function ProjectsHeader({
  query,
  onQueryChange,
  status,
  onStatusChange,
  owner,
  onOwnerChange,
  updated,
  onUpdatedChange,
  onCreateProject,
}) {
  const chipBase =
    'px-3 py-1.5 rounded-full text-sm border transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  const chipOn = 'bg-indigo-vivid text-white border-transparent shadow-sm';
  const chipOff = 'bg-panel text-charcoal-gray border-gray-300 dark:border-gray-700';

  const Chip = ({ active, children, onClick, ariaLabel }) => (
    <button
      type="button"
      className={`${chipBase} ${active ? chipOn : chipOff}`}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
    >
      {children}
    </button>
  );

  return (
    <div className="mb-6">
      {/* Title Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-3xl font-orbitron font-bold text-emerald-green">Projects</h1>

        <div className="flex items-center gap-3">
          <button type="button" onClick={onCreateProject} className="btn btn-primary">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Create Project
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4 relative">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-charcoal-gray" aria-hidden="true" />
        <label htmlFor="projects-search" className="sr-only">
          Search Projects
        </label>
        <input
          id="projects-search"
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="input-field w-full pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
          placeholder="Search by title, description, or member…"
        />
      </div>

      {/* Filter Chips */}
      <div className="mt-4 flex flex-col gap-2">
        {/* Status */}
        <div role="group" aria-labelledby="filter-status" className="flex items-center gap-2 flex-wrap">
          <span id="filter-status" className="text-sm text-lavender-gray">
            Status:
          </span>
          <Chip active={status === 'all'} onClick={() => onStatusChange('all')} ariaLabel="All status">
            All
          </Chip>
          <Chip
            active={status === 'not_started'}
            onClick={() => onStatusChange('not_started')}
            ariaLabel="Not started"
          >
            Not Started
          </Chip>
          <Chip
            active={status === 'in_progress'}
            onClick={() => onStatusChange('in_progress')}
            ariaLabel="In progress"
          >
            In Progress
          </Chip>
          <Chip
            active={status === 'completed'}
            onClick={() => onStatusChange('completed')}
            ariaLabel="Completed"
          >
            Completed
          </Chip>
        </div>

        {/* Owner */}
        <div role="group" aria-labelledby="filter-owner" className="flex items-center gap-2 flex-wrap">
          <span id="filter-owner" className="text-sm text-lavender-gray">
            Owner:
          </span>
          <Chip active={owner === 'all'} onClick={() => onOwnerChange('all')} ariaLabel="All owners">
            All
          </Chip>
          <Chip active={owner === 'me'} onClick={() => onOwnerChange('me')} ariaLabel="Owned by me">
            Me
          </Chip>
          <Chip active={owner === 'team'} onClick={() => onOwnerChange('team')} ariaLabel="Owned by team">
            Team
          </Chip>
        </div>

        {/* Updated */}
        <div role="group" aria-labelledby="filter-updated" className="flex items-center gap-2 flex-wrap">
          <span id="filter-updated" className="text-sm text-lavender-gray">
            Updated:
          </span>
          <Chip active={updated === '7d'} onClick={() => onUpdatedChange('7d')} ariaLabel="Updated last 7 days">
            7d
          </Chip>
          <Chip active={updated === '30d'} onClick={() => onUpdatedChange('30d')} ariaLabel="Updated last 30 days">
            30d
          </Chip>
          <Chip active={updated === 'all'} onClick={() => onUpdatedChange('all')} ariaLabel="Updated anytime">
            All
          </Chip>
        </div>
      </div>
    </div>
  );
}
