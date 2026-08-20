import React from "react";
// unified-project-search-filters-v1
import {
  Filter,
  ArrowUpDown,
  Folder,
  MessageSquare,
  File,
  CheckCircle2,
  User as UserIcon,
  Megaphone,
  MessageCircle,
} from "lucide-react";

const TYPE_ICONS = {
  project: Folder,
  task: CheckCircle2,
  user: UserIcon,
  post: MessageSquare,
  file: File,
  announcement: Megaphone,
  teamRoom: MessageCircle,
};

const TYPE_LABELS = {
  project: "Projects",
  task: "Moves",
  user: "People",
  post: "Posts",
  file: "Files",
  announcement: "Announcements",
  teamRoom: "Team Room",
};

export default function SearchFilters({
  types = [],
  allTypes = [],
  onToggleType,
  sort = "relevance",
  onChangeSort,
  scope = "all",                 // 'all' | 'project' | 'mine'
  onChangeScope,
  projectContextTitle,
  projectScopeAvailable = false,
}) {
  // mobile-search-filter-contrast-v1
  return (
    <div
      className="
        mt-3 flex flex-wrap items-center gap-2
        text-slate-700 dark:text-zinc-300
      "
      role="group"
      aria-label="Search filters"
    >
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
        <Filter className="w-3.5 h-3.5" /> Filters
      </span>

      {/* Type chips */}
      {allTypes.map((t) => {
        const Icon = TYPE_ICONS[t] || Filter;
        const enabled = types.includes(t);
        return (
          <button
            key={t}
            type="button"
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition
              ${enabled
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300"
                : "border-slate-200 bg-white/70 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.06]"
              }`}
            onClick={() => onToggleType?.(t)}
            aria-pressed={enabled ? "true" : "false"}
          >
            <Icon className="w-3.5 h-3.5" />
            {TYPE_LABELS[t] || t}
          </button>
        );
      })}

      {/* Scope */}
      <div className="mt-1 flex w-full flex-wrap items-center gap-1 text-xs sm:ml-2 sm:mt-0 sm:w-auto" role="group" aria-label="Scope">
        <button
          type="button"
          className={`rounded-full border px-2 py-0.5 ${scope === "all"
            ? "border-slate-300 bg-white text-slate-900 shadow-sm dark:border-white/15 dark:bg-white/[0.08] dark:text-white"
            : "border-slate-200 bg-white/60 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400"
          }`}
          onClick={() => onChangeScope?.("all")}
          aria-pressed={scope === "all" ? "true" : "false"}
        >
          All
        </button>
        <button
          type="button"
          className={`rounded-full border px-2 py-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${
            scope === "project"
              ? "border-slate-300 bg-white text-slate-900 shadow-sm dark:border-white/15 dark:bg-white/[0.08] dark:text-white"
              : "border-slate-200 bg-white/60 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400"
          }`}
          onClick={() => {
            if (projectScopeAvailable) {
              onChangeScope?.("project");
            }
          }}
          disabled={!projectScopeAvailable}
          aria-disabled={!projectScopeAvailable}
          aria-pressed={scope === "project" ? "true" : "false"}
          title={
            projectScopeAvailable
              ? projectContextTitle
                ? `This project: ${projectContextTitle}`
                : "This project"
              : "Open a project before using project search"
          }
        >
          This project
        </button>
        <button
          type="button"
          className={`rounded-full border px-2 py-0.5 ${scope === "mine"
            ? "border-slate-300 bg-white text-slate-900 shadow-sm dark:border-white/15 dark:bg-white/[0.08] dark:text-white"
            : "border-slate-200 bg-white/60 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400"
          }`}
          onClick={() => onChangeScope?.("mine")}
          aria-pressed={scope === "mine" ? "true" : "false"}
        >
          Mine
        </button>
      </div>

      {/* Sort */}
      <div className="mt-1 flex w-full items-center justify-end gap-1 text-xs sm:ml-auto sm:mt-0 sm:w-auto">
        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
        <label htmlFor="search-sort" className="sr-only">Sort</label>
        <select
          id="search-sort"
          value={sort}
          onChange={(e) => onChangeSort?.(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none dark:border-white/10 dark:bg-[#18181d] dark:text-zinc-200"
          aria-label="Sort results"
        >
          <option value="relevance">Relevance</option>
          <option value="recent">Recent</option>
        </select>
      </div>
    </div>
  );
}
