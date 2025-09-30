import React from "react";

/**
 * Lightweight skeletons for the search page.
 * Use: {loading && <SearchSkeleton />}
 */
export default function SearchSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <Group titleWidth="90px" />
      <Item />
      <Item />
      <Item />
      <Group titleWidth="60px" />
      <Item />
      <Item />
    </div>
  );
}

function Group({ titleWidth = "72px" }) {
  return (
    <div className="mt-2">
      <div
        className="h-3 rounded bg-slate-200/60 dark:bg-slate-700/60"
        style={{ width: titleWidth }}
      />
      <div className="sr-only">Loading results…</div>
    </div>
  );
}

function Item() {
  return (
    <div className="result-card animate-pulse">
      <div className="h-3.5 w-1/3 rounded bg-slate-200/70 dark:bg-slate-700/70" />
      <div className="mt-2 h-2.5 w-2/3 rounded bg-slate-200/60 dark:bg-slate-700/60" />
    </div>
  );
}
