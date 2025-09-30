import React from "react";
import { Filter, ArrowUpDown, Users, Folder, MessageSquare, File, CheckCircle2, User as UserIcon } from "lucide-react";

const TYPE_ICONS = {
  project: Folder,
  task: CheckCircle2,
  user: UserIcon,
  post: MessageSquare,
  file: File,
};

export default function SearchFilters({
  types = [],
  allTypes = [],
  onToggleType,
  sort = "relevance",
  onChangeSort,
  scope = "all",                 // 'all' | 'project' | 'mine'
  onChangeScope,
  projectContextTitle,          // optional: show when scope === 'project'
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Search filters">
      <span className="inline-flex items-center gap-1 text-xs text-muted">
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
              ${enabled ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-surface border-border text-muted hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}
            onClick={() => onToggleType?.(t)}
            aria-pressed={enabled ? "true" : "false"}
          >
            <Icon className="w-3.5 h-3.5" />
            {t}
          </button>
        );
      })}

      {/* Scope */}
      <div className="ml-2 inline-flex items-center gap-1 text-xs" role="group" aria-label="Scope">
        <button
          type="button"
          className={`rounded-full border px-2 py-0.5 ${scope === "all" ? "bg-slate-100 dark:bg-slate-800/60 border-slate-300" : "border-border text-muted"}`}
          onClick={() => onChangeScope?.("all")}
          aria-pressed={scope === "all" ? "true" : "false"}
        >
          All
        </button>
        <button
          type="button"
          className={`rounded-full border px-2 py-0.5 ${scope === "project" ? "bg-slate-100 dark:bg-slate-800/60 border-slate-300" : "border-border text-muted"}`}
          onClick={() => onChangeScope?.("project")}
          aria-pressed={scope === "project" ? "true" : "false"}
          title={projectContextTitle ? `This project: ${projectContextTitle}` : "This project"}
        >
          This project
        </button>
        <button
          type="button"
          className={`rounded-full border px-2 py-0.5 ${scope === "mine" ? "bg-slate-100 dark:bg-slate-800/60 border-slate-300" : "border-border text-muted"}`}
          onClick={() => onChangeScope?.("mine")}
          aria-pressed={scope === "mine" ? "true" : "false"}
        >
          Mine
        </button>
      </div>

      {/* Sort */}
      <div className="inline-flex items-center gap-1 text-xs ml-auto">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
        <label htmlFor="search-sort" className="sr-only">Sort</label>
        <select
          id="search-sort"
          value={sort}
          onChange={(e) => onChangeSort?.(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
          aria-label="Sort results"
        >
          <option value="relevance">Relevance</option>
          <option value="recent">Recent</option>
        </select>
      </div>
    </div>
  );
}
