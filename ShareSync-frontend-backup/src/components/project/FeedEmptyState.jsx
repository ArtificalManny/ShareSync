import React from "react";

/**
 * FeedEmptyState
 * Shared empty (and/or loading) state card for the feed.
 *
 * Props:
 *  - icon?: string | ReactNode
 *  - title: string
 *  - body?: string
 *  - action?: ReactNode
 *  - loading?: boolean
 */
export default function FeedEmptyState({ icon = "🧵", title, body, action, loading = false }) {
  return (
    <div className="rounded-xl border border-slate-200/70 dark:border-slate-700 p-6 bg-white/70 dark:bg-slate-800/70 text-center">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mx-auto" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto" />
        </div>
      ) : (
        <>
          <div className="text-3xl mb-2" aria-hidden="true">
            {icon}
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {body && <p className="text-sm text-slate-500 mt-1">{body}</p>}
          {action && <div className="mt-3">{action}</div>}
        </>
      )}
    </div>
  );
}
