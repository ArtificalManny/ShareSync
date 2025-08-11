// /src/components/projects/RightRail.jsx
import React from 'react';
import MyStatsCard from './MyStatsCard.jsx';
import PendingInvitesCard from './PendingInvitesCard.jsx';
import DailyGoalsCard from '../goals/DailyGoalsCard.jsx';
import AISuggestionCard from '../AISuggestionCard.jsx';

export default function RightRail({ onQuickStatus, onQuickOwner, onQuickUpdated }) {
  // The parent page (Projects.jsx) owns the active values; these are stateless buttons.
  // For SR users, we still expose aria-pressed heuristically via URL params if present:
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const status = params.get('status') || 'all';
  const owner = params.get('owner') || 'all';
  const updated = params.get('updated') || '7d';

  const chip =
    'px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  return (
    <aside className="space-y-4">
      {/* My Stats mini-chart */}
      <MyStatsCard />

      {/* Daily Goals + AI Suggestion */}
      <DailyGoalsCard />
      <AISuggestionCard />

      {/* Quick Filters */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 border border-slate-200/60 dark:border-slate-700/60">
        <h3 id="quick-filters" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Quick Filters
        </h3>

        <div role="group" aria-labelledby="quick-status" className="mb-3">
          <div id="quick-status" className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Status
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onQuickStatus('all')}
              className={chip}
              aria-pressed={status === 'all'}
              aria-label="Status: All"
            >
              All
            </button>
            <button
              onClick={() => onQuickStatus('not_started')}
              className={chip}
              aria-pressed={status === 'not_started'}
              aria-label="Status: Not started"
            >
              Not Started
            </button>
            <button
              onClick={() => onQuickStatus('in_progress')}
              className={chip}
              aria-pressed={status === 'in_progress'}
              aria-label="Status: In progress"
            >
              In Progress
            </button>
            <button
              onClick={() => onQuickStatus('completed')}
              className={chip}
              aria-pressed={status === 'completed'}
              aria-label="Status: Completed"
            >
              Completed
            </button>
          </div>
        </div>

        <div role="group" aria-labelledby="quick-owner" className="mb-3">
          <div id="quick-owner" className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Owner
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onQuickOwner('all')}
              className={chip}
              aria-pressed={owner === 'all'}
              aria-label="Owner: All"
            >
              All
            </button>
            <button
              onClick={() => onQuickOwner('me')}
              className={chip}
              aria-pressed={owner === 'me'}
              aria-label="Owner: Me"
            >
              Me
            </button>
            <button
              onClick={() => onQuickOwner('team')}
              className={chip}
              aria-pressed={owner === 'team'}
              aria-label="Owner: Team"
            >
              Team
            </button>
          </div>
        </div>

        <div role="group" aria-labelledby="quick-updated">
          <div id="quick-updated" className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Updated
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onQuickUpdated('7d')}
              className={chip}
              aria-pressed={updated === '7d'}
              aria-label="Updated: last 7 days"
            >
              Last 7d
            </button>
            <button
              onClick={() => onQuickUpdated('30d')}
              className={chip}
              aria-pressed={updated === '30d'}
              aria-label="Updated: last 30 days"
            >
              Last 30d
            </button>
            <button
              onClick={() => onQuickUpdated('all')}
              className={chip}
              aria-pressed={updated === 'all'}
              aria-label="Updated: all time"
            >
              All time
            </button>
          </div>
        </div>
      </div>

      {/* Pending Invites */}
      <PendingInvitesCard />
    </aside>
  );
}
