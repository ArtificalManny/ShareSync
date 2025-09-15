import React, { useMemo } from "react";
import { Search } from "lucide-react";

/**
 * FeedFilterBar
 * Pills + optional search/date controls for the unified feed.
 *
 * Props:
 *  - value: 'all'|'updates'|'tasks'|'files'|'system'
 *  - onChange: (val) => void
 *  - showSearch?: boolean
 *  - onSearch?: (text) => void
 *  - searchValue?: string
 *  - rightExtra?: ReactNode  (e.g., Refresh button)
 */
export default function FeedFilterBar({
  value = "all",
  onChange,
  showSearch = true,
  onSearch,
  searchValue = "",
  rightExtra = null,
}) {
  const pills = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "updates", label: "Updates" },
      { key: "tasks", label: "Tasks" },
      { key: "files", label: "Files" },
      { key: "system", label: "System" },
    ],
    []
  );

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      <div className="inline-flex flex-wrap items-center gap-2">
        {pills.map(({ key, label }) => {
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange?.(key)}
              className={[
                "inline-flex items-center rounded-xl px-3 py-1 text-sm border transition-colors focus-visible:outline-none",
                active
                  ? "bg-grad-purple text-white border-transparent shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-300/60",
              ].join(" ")}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {showSearch && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Search updates, tasks, files…"
            className="pl-7 pr-3 py-1.5 rounded-xl text-sm border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 w-[220px] focus-visible:ring-2 focus-visible:ring-indigo-300"
          />
        </div>
      )}

      {rightExtra}
    </div>
  );
}
