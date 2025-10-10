// src/components/projects/RightRail.jsx
import React from 'react';
import MyStatsCard from './MyStatsCard.jsx';
import PendingInvitesCard from './PendingInvitesCard.jsx';
import DailyGoalsCard from '../goals/DailyGoalsCard.jsx';
import AISuggestionCard from '../AISuggestionCard.jsx';
import TraceOutline from '../ui/TraceOutline.jsx';
import Button from '../ui/Button.jsx';
import Chip from '../ui/Chip.jsx';

export default function RightRail({ onQuickStatus, onQuickOwner, onQuickUpdated }) {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const status = params.get('status') || 'all';
  const owner = params.get('owner') || 'all';
  const updated = params.get('updated') || '7d';

  return (
    <aside className="space-y-4">
      {/* Wrapped with TraceOutline for cohesive glow */}
      <TraceOutline color="var(--info)" stroke={1.5} speedMs={3600}>
        <div className="card accent-bar shine rounded-2xl border border-border overflow-hidden">
          <span className="accent-bar__left" aria-hidden="true" />
          <div className="p-3">
            <MyStatsCard />
          </div>
        </div>
      </TraceOutline>

      <TraceOutline color="var(--info)" stroke={1.5} speedMs={3600}>
        <div className="card accent-bar shine rounded-2xl border border-border overflow-hidden">
          <span className="accent-bar__left" aria-hidden="true" />
          <div className="p-3">
            <DailyGoalsCard />
          </div>
        </div>
      </TraceOutline>

      <TraceOutline color="var(--info)" stroke={1.5} speedMs={3600}>
        <div className="card accent-bar shine rounded-2xl border border-border overflow-hidden">
          <span className="accent-bar__left" aria-hidden="true" />
          <div className="p-3">
            <AISuggestionCard />
          </div>
        </div>
      </TraceOutline>

      {/* Quick Filters – styled like other cards; tiny dot in header */}
      <div className="card accent-bar shine rounded-2xl border border-border">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="p-4">
          <h3 id="quick-filters" className="card-header mb-3 inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
              aria-hidden="true"
            />
            Quick Filters
          </h3>

          {/* Status Group */}
          <div role="group" aria-labelledby="quick-status" className="mb-3">
            <div id="quick-status" className="text-xs text-muted mb-2">
              Status
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip
                as="button"
                onClick={() => onQuickStatus('all')}
                selected={status === 'all'}
                aria-label="Status: All"
                size="sm"
              >
                All
              </Chip>
              <Chip
                as="button"
                onClick={() => onQuickStatus('not_started')}
                selected={status === 'not_started'}
                aria-label="Status: Not started"
                size="sm"
              >
                Not Started
              </Chip>
              <Chip
                as="button"
                onClick={() => onQuickStatus('in_progress')}
                selected={status === 'in_progress'}
                aria-label="Status: In progress"
                size="sm"
              >
                In Progress
              </Chip>
              <Chip
                as="button"
                onClick={() => onQuickStatus('completed')}
                selected={status === 'completed'}
                aria-label="Status: Completed"
                size="sm"
              >
                Completed
              </Chip>
            </div>
          </div>

          {/* Owner Group */}
          <div role="group" aria-labelledby="quick-owner" className="mb-3">
            <div id="quick-owner" className="text-xs text-muted mb-2">
              Owner
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip
                as="button"
                onClick={() => onQuickOwner('all')}
                selected={owner === 'all'}
                aria-label="Owner: All"
                size="sm"
              >
                All
              </Chip>
              <Chip
                as="button"
                onClick={() => onQuickOwner('me')}
                selected={owner === 'me'}
                aria-label="Owner: Me"
                size="sm"
              >
                Me
              </Chip>
              <Chip
                as="button"
                onClick={() => onQuickOwner('team')}
                selected={owner === 'team'}
                aria-label="Owner: Team"
                size="sm"
              >
                Team
              </Chip>
            </div>
          </div>

          {/* Updated Group */}
          <div role="group" aria-labelledby="quick-updated">
            <div id="quick-updated" className="text-xs text-muted mb-2">
              Updated
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip
                as="button"
                onClick={() => onQuickUpdated('7d')}
                selected={updated === '7d'}
                aria-label="Updated: last 7 days"
                size="sm"
              >
                Last 7d
              </Chip>
              <Chip
                as="button"
                onClick={() => onQuickUpdated('30d')}
                selected={updated === '30d'}
                aria-label="Updated: last 30 days"
                size="sm"
              >
                Last 30d
              </Chip>
              <Chip
                as="button"
                onClick={() => onQuickUpdated('all')}
                selected={updated === 'all'}
                aria-label="Updated: all time"
                size="sm"
              >
                All time
              </Chip>
            </div>
          </div>
        </div>
      </div>

      {/* Keep invites card simple (no outline) */}
      <div className="card accent-bar shine rounded-2xl border border-border overflow-hidden">
        <span className="accent-bar__left" aria-hidden="true" />
        <div className="p-3">
          <PendingInvitesCard />
        </div>
      </div>
    </aside>
  );
}
