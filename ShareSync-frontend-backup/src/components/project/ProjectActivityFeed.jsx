// /src/components/project/ProjectActivityFeed.jsx
import React, { useCallback, useEffect, useRef } from 'react';
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
      performance.mark('first_activity_render');
      const start = performance.getEntriesByName('project_data_ready').at(-1)?.startTime;
      if (start) {
        // helpful console metric during QA
        // eslint-disable-next-line no-console
        console.log(
          '[Render] First activity after data ms:',
          (performance.now() - start).toFixed(0)
        );
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
    },
    poller,
  });

  return (
    <section aria-label="Project activity feed" className="space-y-3">
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
      ) : items?.length ? (
        <>
          {items.map((u) => (
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
          title="No updates yet"
          body="Kick things off with a quick update so everyone knows the plan."
          action={
            onPostUpdate ? (
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