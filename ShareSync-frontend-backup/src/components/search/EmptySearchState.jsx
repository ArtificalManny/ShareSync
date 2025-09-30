import React from "react";
import { Search, Stars, Users, Folder, FileText, File, MessageSquare } from "lucide-react";

export default function EmptySearchState({ q = "", onFocusInput }) {
  const hasQ = String(q || "").trim().length > 0;

  return (
    <div
      role="region"
      aria-label="Search empty state"
      className="result-card text-center py-10"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-border bg-surface">
        <Search className="w-5 h-5 text-indigo-600" />
      </div>

      <h2 className="mt-3 text-sm font-semibold text-text">
        {hasQ ? "No results" : "Search your workspace"}
      </h2>

      <p className="mt-1 text-xs text-muted">
        {hasQ
          ? "Try different keywords or adjusting filters."
          : "Find projects, tasks, teammates, files, and posts."}
      </p>

      {!hasQ && (
        <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
          <Hint icon={Users} label="Mention a user with" kbd="@alice" />
          <Hint icon={Folder} label="Scope to a project" kbd="#infra" />
          <Hint icon={File} label="Filter by type" kbd="type:file" />
          <Hint icon={MessageSquare} label="Search posts" kbd="type:post" />
          <Hint icon={FileText} label="Include tasks" kbd="type:task" />
          <Hint icon={Stars} label="Sort recent" kbd="sort:recent" />
        </ul>
      )}

      <div className="mt-4 text-[11px] text-muted">
        Tip: Press <Kbd>↑</Kbd>/<Kbd>↓</Kbd> to navigate results, <Kbd>Enter</Kbd> to open.
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => onFocusInput?.()}
          className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Start typing
        </button>
      </div>
    </div>
  );
}

function Hint({ icon: Icon, label, kbd }) {
  return (
    <li className="flex items-center gap-2 text-[12px]">
      <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
      <span className="truncate">{label}</span>
      <span className="ml-auto kbd">{kbd}</span>
    </li>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="kbd">{children}</kbd>
  );
}
