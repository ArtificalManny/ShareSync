import React from "react";

export default function MembersPanel({ members = [] }) {
  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-ink-900 dark:text-white mb-2">Members</h3>
      <ul className="space-y-2">
        {members.map((m, i) => (
          <li key={m._id || m.email || i} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 grid place-content-center text-xs">
              {(m.name || m.email || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm">{m.name || m.email || "Member"}</div>
              <div className="text-xs text-slate-500">{m.role || "Member"}</div>
            </div>
          </li>
        ))}
      </ul>
      {members.length === 0 && <p className="text-sm text-slate-500">No members yet.</p>}
    </section>
  );
}