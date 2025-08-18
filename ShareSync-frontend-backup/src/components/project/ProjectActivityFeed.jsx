// /src/components/project/ProjectActivityFeed.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSocket from '../../hooks/useSocket';
import EmptyState from '../EmptyState';

export default function ProjectActivityFeed({
  projectId,
  items,
  loading,
  hasMore,
  onLoadMore,
  onPostUpdate,   // optional handler from composer
  onRefetch,      // optional, used by socket/polling
}) {
  // mark when first real items appear after project data is ready
  const firstRenderRef = useRef(false);
  useEffect(() => {
    if (!firstRenderRef.current && items && items.length > 0) {
      firstRenderRef.current = true;
      performance.mark?.('first_activity_render');
      const start = performance.getEntriesByName('project_data_ready').at(-1)?.startTime;
      if (start) {
        // eslint-disable-next-line no-console
        console.log('[Render] First activity after data ms:', (performance.now() - start).toFixed(0));
      }
    }
  }, [items]);

  // Backoff poller (if desired) just calls onRefetch
  const poller = useCallback(() => onRefetch?.(), [onRefetch]);

  // Subscribe to realtime room if we have a projectId
  useSocket(projectId ? `project:${projectId}` : null, {
    onEvents: {
      'project:update': () => onRefetch?.(),
      'task:created': () => onRefetch?.(),
      'task:updated': () => onRefetch?.(),
      'task:completed': () => onRefetch?.(),
      'task:due_changed': () => onRefetch?.(),
      'invite:accepted': () => onRefetch?.(),
      'activity:new': () => onRefetch?.(), // ← catch-all if backend emits this
    },
    poller,
  });

  // ---------------- Filters (local) ----------------
  const [filter, setFilter] = useState('all'); // 'all' | 'updates' | 'tasks' | 'files'

  // Best-effort classifier so we don’t need API changes:
  const classify = (u) => {
    const kind = (u.kind || u.type || '').toString().toLowerCase();
    if (kind.includes('file')) return 'files';
    if (kind.includes('task')) return 'tasks';
    if (kind.includes('update') || kind === '' /* many simple text updates */) return 'updates';
    // Heuristics fallback:
    const txt = (u.text || '').toLowerCase();
    if (txt.includes('uploaded') || txt.includes('.pdf') || txt.includes('.png') || txt.includes('.doc')) return 'files';
    if (txt.includes('task') || txt.includes('completed') || txt.includes('assigned')) return 'tasks';
    return 'updates';
  };

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items || [];
    return (items || []).filter((u) => classify(u) === filter);
  }, [items, filter]);

  // ---------------- Render ----------------
  return (
    <section aria-label="Project activity feed" className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'updates', label: 'Updates' },
          { key: 'tasks', label: 'Tasks' },
          { key: 'files', label: 'Files' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={[
              'inline-flex items-center rounded-xl px-3 py-1 text-sm border',
              filter === key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
            ].join(' ')}
            aria-pressed={filter === key}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        {/* Optional manual refresh */}
        {onRefetch && (
          <button
            onClick={() => onRefetch()}
            className="inline-flex items-center rounded-xl border border-slate-200/70 dark:border-slate-700 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Composer (optional) */}
      {onPostUpdate && (
        <Composer onSubmit={onPostUpdate} />
      )}

      {/* List */}
      {loading && !items?.length ? (
        <div className="rounded-xl border border-slate-200/70 dark:border-slate-700 p-4 bg-white/70 dark:bg-slate-800/70">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-4 bg-slate-200 rounded w-1/3" />
          </div>
        </div>
      ) : filteredItems?.length ? (
        <>
          {filteredItems.map((u) => (
            <article
              key={u._id}
              className="rounded-xl border border-slate-200/70 dark:border-slate-700 p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md"
            >
              <div className="text-sm text-slate-800 dark:text-slate-100">{u.text}</div>
              <div className="text-xs text-slate-500 mt-1">
                {u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}
              </div>
            </article>
          ))}

          {hasMore && (
            <div className="pt-2">
              <button
                onClick={onLoadMore}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Load more activity"
              >
                Load more
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="🧵"
          title={filter === 'all' ? 'No updates yet' : 'No items in this filter'}
          body={
            filter === 'all'
              ? 'Kick things off with a quick update so everyone knows the plan.'
              : 'Try switching filters or posting an update.'
          }
          action={
            onPostUpdate && filter === 'all' ? (
              <button
                onClick={() => onPostUpdate('First update 👋')}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Post an update
              </button>
            ) : null
          }
        />
      )}
    </section>
  );
}

// very small inline composer to keep moving
function Composer({ onSubmit }) {
  const inputRef = useRef(null);
  const handleSend = () => {
    const val = inputRef.current?.value ?? '';
    if (val.trim()) {
      onSubmit(val.trim());
      inputRef.current.value = '';
    }
  };
  return (
    <div className="rounded-xl border border-slate-200/70 dark:border-slate-700 p-3 bg-white dark:bg-slate-900">
      <label htmlFor="project-update-input" className="sr-only">Post an update</label>
      <div className="flex gap-2">
        <input
          id="project-update-input"
          ref={inputRef}
          type="text"
          placeholder="What’s the latest?"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        />
        <button
          onClick={handleSend}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Post
        </button>
      </div>
    </div>
  );
}
